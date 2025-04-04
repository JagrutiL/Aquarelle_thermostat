import mysql.connector
import time
import datetime
from paho.mqtt import client as mqtt_client
from flask import Flask, render_template, jsonify, request
from flask_cors import CORS
from flask_socketio import SocketIO
import socket
import json

app = Flask(__name__) 
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

def get_local_ip():
    """Get the local IP address dynamically"""
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    s.connect(("8.8.8.8", 80))  # Connect to an external server
    ip = s.getsockname()[0]
    s.close()
    return ip

def update_ip_json():
    """Update ip.json with the current local IP"""
    current_ip = f"http://{get_local_ip()}:5000"
    
    ip_data = {"ip": current_ip}
    
    with open("static/js/ip.json", "w") as f:  # Ensure it's inside `static/` so it's accessible
        json.dump(ip_data, f, indent=4)

update_ip_json()        

@app.route('/ip.json')
def get_ip():
    """Serve the updated IP JSON file"""
    with open("static/ip.json", "r") as f:
        ip_data = json.load(f)
    return jsonify(ip_data)


# MQTT Broker details
BROKER = '203.109.124.70'
PORT = 18889
TOPIC = "3pTempF0F0F0/control"

hostname = socket.gethostname()
ip_address = socket.gethostbyname(hostname)
server_url = f"http://{ip_address}:5000"

# Save the IP to ip.json
with open("ip.json", "w") as f:
    json.dump({"ip": server_url}, f)

# MySQL Database connection details
DB_CONFIG = {
    "host": "localhost",  # Change if MySQL is hosted elsewhere
    "user": "root",       # Your MySQL username
    "password": "root",   # Your MySQL password
    "database": "mqtt_data"
}

def connect_db():
    """Connect to MySQL database."""
    return mysql.connector.connect(**DB_CONFIG)

def setup_database():
    """Create MySQL database and table if they do not exist."""
    conn = connect_db()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS sensor_data (
            id INT AUTO_INCREMENT PRIMARY KEY,
            device_id VARCHAR(50),
            R1 FLOAT, Y1 FLOAT, B1 FLOAT,
            R2 FLOAT, Y2 FLOAT, B2 FLOAT,
            R3 FLOAT, Y3 FLOAT, B3 FLOAT,
            alert_flag INT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    # cursor.execute("""ALTER TABLE sensor_data ADD UNIQUE unique_index (device_id, timestamp);""") 
    conn.commit()

    # ✅ Create `panel` table if it does not exist
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS panel (
            id INT NOT NULL AUTO_INCREMENT,
            device_id VARCHAR(50) NOT NULL,
            panel_name VARCHAR(20) NOT NULL,
            phase VARCHAR(10) NOT NULL,
            PRIMARY KEY (id),
            UNIQUE KEY unique_device_panel (device_id, panel_name, phase)
        )
    """)
    conn.commit()
    print("✅ `panel` table setup complete")

    # ✅ Check if data already exists before inserting
    cursor.execute("SELECT COUNT(*) FROM panel")
    count = cursor.fetchone()[0]

    if count == 0:  # Insert only if table is empty
        cursor.executemany("""
            INSERT INTO panel (id, device_id, panel_name, phase) VALUES (%s, %s, %s, %s)
        """, [
            (4, '3pTempF0F0F0', 'panel2', 'B2'),
            (5, '3pTempF0F0F0', 'panel2', 'R2'),
            (6, '3pTempF0F0F0', 'panel2', 'Y2'),
            (7, '3pTempF0F0F0', 'panel3', 'B3'),
            (8, '3pTempF0F0F0', 'panel3', 'R3'),
            (9, '3pTempF0F0F0', 'panel3', 'Y3'),
            (2, '3pTempF0F0F0', 'shilpa', 'B1'),
            (3, '3pTempF0F0F0', 'shilpa', 'R1'),
            (1, '3pTempF0F0F0', 'shilpa', 'Y1')
        ])
        conn.commit()
        print("✅ Initial data inserted into `panel` table")
    else:
        print("ℹ️ Data already exists in `panel` table, skipping insertion.")
        
    cursor.close()
    conn.close()
    print("✅ Database setup complete")

def connect_mqtt():
    """Connect to MQTT broker and subscribe to topic."""
    def on_connect(client, userdata, flags, rc):
        if rc == 0:
            print("✅ Connected to MQTT Broker!")
            client.subscribe("#", qos=1)
        else:
            print(f"❌ Connection failed with code {rc}")

    client = mqtt_client.Client()
    client.on_connect = on_connect
    client.on_message = on_message
    client.connect(BROKER, PORT)
    return client

def on_message(client, userdata, msg):
    """Handle incoming MQTT messages."""
    try:
        payload = msg.payload.decode().strip("{} ")
        print(f"📩 Received `{payload}` from `{msg.topic}`")

        data = payload.split(":")
        if len(data) <= 12:
            print(f"⚠️ Incomplete data received: {data}")
            return

        device_id = data[1]
        if device_id == "200":
            print(f"⏭️ Skipping insertion for device_id: {device_id}")
            return  
        R1, Y1, B1 = map(float, data[2:5])
        R2, Y2, B2 = map(float, data[5:8])
        R3, Y3, B3 = map(float, data[8:11])
        alert_flag = int(data[12])

        insert_data(device_id, R1, Y1, B1, R2, Y2, B2, R3, Y3, B3, alert_flag)
    except Exception as e:
        print(f"❌ Error processing message: {e}")

def insert_data(device_id, R1, Y1, B1, R2, Y2, B2, R3, Y3, B3, alert_flag):
    """Insert sensor data into MySQL."""
    conn = connect_db()
    cursor = conn.cursor()
    try:
        sql = """
            INSERT INTO sensor_data (device_id, R1, Y1, B1, R2, Y2, B2, R3, Y3, B3, alert_flag, timestamp)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        values = (device_id, R1, Y1, B1, R2, Y2, B2, R3, Y3, B3, alert_flag, datetime.datetime.now())
        cursor.execute(sql, values)
        conn.commit()
        print("✅ Data inserted successfully!")
    except mysql.connector.Error as err:
        print(f"❌ MySQL Error: {err}")
    finally:
        cursor.close()
        conn.close()

# def get_latest_device_data():
#     """Fetch latest sensor data for all devices."""
#     conn = connect_db()
#     cursor = conn.cursor(dictionary=True)
#     cursor.execute("""
#         SELECT device_id, R1, Y1, B1, R2, Y2, B2, R3, Y3, B3, timestamp
#         FROM sensor_data
#         WHERE (device_id, timestamp) IN (
#             SELECT device_id, MAX(timestamp) FROM sensor_data GROUP BY device_id
#         )
#     """)
#     data = cursor.fetchall()
#     for row in data:
#         row['timestamp'] = row['timestamp'].strftime('%Y-%m-%d %H:%M:%S')
#     cursor.close()
#     conn.close()
#     return data

def get_latest_device_data():
    """Fetch latest sensor data and min/max values for all devices."""
    conn = connect_db()
    cursor = conn.cursor(dictionary=True)

    # Fetch latest sensor data
    cursor.execute("""
        SELECT device_id, R1, Y1, B1, R2, Y2, B2, R3, Y3, B3, timestamp
        FROM sensor_data
        WHERE (device_id, timestamp) IN (
            SELECT device_id, MAX(timestamp) FROM sensor_data GROUP BY device_id
        )
    """)
    latest_data = cursor.fetchall()

    # Fetch min/max values
    cursor.execute("""
        SELECT 
            device_id,
            MIN(R1) AS minR1, MAX(R1) AS maxR1,
            MIN(R2) AS minR2, MAX(R2) AS maxR2,
            MIN(R3) AS minR3, MAX(R3) AS maxR3,
            MIN(Y1) AS minY1, MAX(Y1) AS maxY1,
            MIN(Y2) AS minY2, MAX(Y2) AS maxY2,
            MIN(Y3) AS minY3, MAX(Y3) AS maxY3,
            MIN(B1) AS minB1, MAX(B1) AS maxB1,
            MIN(B2) AS minB2, MAX(B2) AS maxB2,
            MIN(B3) AS minB3, MAX(B3) AS maxB3
        FROM sensor_data
        WHERE date(timestamp) = CURDATE() GROUP BY device_id ;
    """)
    min_max_data = {row['device_id']: row for row in cursor.fetchall()}

    # Merge latest data with min/max data
    for row in latest_data:
        row['timestamp'] = row['timestamp'].strftime('%Y-%m-%d %H:%M:%S')
        if row['device_id'] in min_max_data:
            row.update(min_max_data[row['device_id']])  # Merge min/max values

    cursor.close()
    conn.close()
    
    return latest_data

@app.route('/')
def home():
    return render_template('login.html')

# @app.route('/home', methods=['POST', 'GET'])
# def dashboard():
#     devices = get_latest_device_data()
#     print("Devices data:------------", devices)
#     return render_template('dashboard.html', devices=devices)

@app.route('/home', methods=['POST', 'GET'])
def dashboard():
    global updated_name,updated_name_2,updated_name_3
    devices = get_latest_device_data()
    conn = connect_db()
    cursor = conn.cursor()
    print("Devices data:------------", devices)
    cursor.execute("SELECT DISTINCT panel_name FROM panel WHERE phase IN ('B1', 'R1', 'Y1') LIMIT 1")
    updated_name = cursor.fetchone()[0]
    print('updated_name',updated_name)
    cursor.execute("SELECT DISTINCT panel_name FROM panel WHERE phase IN ('B2', 'R2', 'Y2') LIMIT 1")
    updated_name_2 = cursor.fetchone()[0]
    print('updated_name_2',updated_name_2)
    cursor.execute("SELECT DISTINCT panel_name FROM panel WHERE phase IN ('B3', 'R3', 'Y3') LIMIT 1")
    updated_name_3 = cursor.fetchone()[0] 
    print('updated_name_3',updated_name_3)
    # temperature()
    cursor.execute("SELECT DISTINCT panel_name FROM panel")
    panel_names = [row[0] for row in cursor.fetchall()] 

    panel_data = {}

    for panel_name in panel_names:
        cursor.execute("SELECT DISTINCT phase FROM panel WHERE panel_name = %s", (panel_name,))
        phases = [row[0] for row in cursor.fetchall()]
        panel_data[panel_name] = phases

    print("Panel Data:", panel_data)
    
    return render_template('dashboard.html', devices=devices,updated_name=updated_name, updated_name_2=updated_name_2, updated_name_3=updated_name_3,panel_data=panel_data)

@socketio.on('connect')
def handle_connect():
    print("Client connected!")
    socketio.start_background_task(send_live_data)

def send_live_data():
    """Emit latest data to frontend every 60 seconds."""
    while True:
        socketio.emit('update_temperature', get_latest_device_data())
        time.sleep(60)

# @app.route('/graph', methods=['GET'])
# def temperature():
#     devices = get_latest_device_data()
#     return render_template('temperature_graph.html', devices=devices)

@app.route('/graph', methods=['GET'])
def temperature():
    devices = get_latest_device_data()
    dashboard()
    return render_template('temperature_graph.html', devices=devices, updated_name=updated_name, updated_name_2=updated_name_2, updated_name_3=updated_name_3)

@socketio.on('temperature_graph_data')
def temperature_graph_data(data):
    try:
        print("Selected Data for temperature_graph_data graph:", data)
        today = datetime.datetime.today().strftime('%Y-%m-%d')
        start_date = data.get('startDate', today)
        end_date = data.get('endDate', today)
        timeselect = data.get('timeSelect', 'daily')
        controlGraph = data.get('controlGraph','panel-1')
        print('controlGraph-------',controlGraph)


        panel_map = {
            'panel-1': ('R1', 'Y1', 'B1'),
            'panel-2': ('R2', 'Y2', 'B2'),
            'panel-3': ('R3', 'Y3', 'B3')
        }
        r_col, y_col, b_col = panel_map.get(controlGraph, ('R1', 'Y1', 'B1'))
        print("Selected columns:", r_col, y_col, b_col)
        conn = connect_db()
        cursor = conn.cursor(dictionary=True)

        if timeselect == "daily" or (start_date == end_date and timeselect == "set-date"):
            # Hourly data query for daily or the same day set-date
            query = f"""
                WITH r AS (
                    SELECT 
                        CONCAT(LPAD(HOUR(timestamp), 2, '0'), ':', LPAD(FLOOR(MINUTE(timestamp) / 10) * 10, 2, '0')) AS time_interval, 
                        DATE(timestamp) AS date,
                        device_id,
                        AVG({r_col}) AS avg_R, 
                        AVG({y_col}) AS avg_Y, 
                        AVG({b_col}) AS avg_B
                    FROM 
                        sensor_data
                    WHERE 
                        DATE(timestamp) BETWEEN %s AND %s
                    GROUP BY 
                        date, time_interval, device_id
                    ORDER BY 
                        time_interval ASC
                )
                SELECT 
                    r.time_interval AS time_interval, 
                    ROUND(AVG(r.avg_R), 2) AS avg_R, 
                    ROUND(AVG(r.avg_Y), 2) AS avg_Y, 
                    ROUND(AVG(r.avg_B), 2) AS avg_B
                FROM 
                    r
                GROUP BY 
                    r.time_interval
                ORDER BY 
                    r.time_interval ASC;
            """
            
            cursor.execute(query, (start_date, end_date))

            # Fetch query results
            results = cursor.fetchall()
            # print("Results:", results)

        data = []
        for row in results:
            time_interval = row["time_interval"]
            avg_R = row["avg_R"]
            avg_Y = row["avg_Y"]
            avg_B = row["avg_B"]

            # Store data correctly
            data.append({
                'hour': time_interval,
                'temperature1': avg_R,
                'temperature2': avg_Y,
                'temperature3': avg_B,
            })

        # print("Data to be sent:", data)
        # Emit the filled data
        socketio.emit('temperature_graph_data', data, room=request.sid)

    except Exception as e:
        print("Database query failed:", e)
        socketio.emit('temperature_graph_data', [], room=request.sid)


@app.route('/update_panel_name', methods=['POST'])
def update_panel_name():
    global updated_name
    data = request.json
    new_name = data.get('panel_name', '').strip()
    if not new_name:
        return jsonify({"error": "Panel name cannot be empty!"}), 400
    conn = None
    try:
        conn = connect_db()
        cursor = conn.cursor()
        # Check if phases exist
        cursor.execute("SELECT COUNT(*) FROM panel WHERE phase IN ('B1', 'R1', 'Y1')")
        phase_count = cursor.fetchone()[0]
        if phase_count == 0:
            return jsonify({"error": "Phases not found"}), 404
        # Update panel name for all three phases
        update_query = "UPDATE panel SET panel_name = %s WHERE phase IN ('B1', 'R1', 'Y1')"
        cursor.execute(update_query, (new_name,))
        conn.commit()

        return jsonify({"message": "Panel names updated successfully"}), 200
    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({"error": f"Database error: {str(e)}"}), 500

    finally:
        if conn:
            cursor.close()
            conn.close()



@app.route('/update_panel_name_2', methods=['POST'])
def update_panel_name_2():
    data = request.json
    new_name = data.get('panel_name', '').strip()

    if not new_name:
        return jsonify({"error": "Panel name cannot be empty!"}), 400

    conn = None
    try:
        conn = connect_db()
        cursor = conn.cursor()

        # Check if phases exist
        cursor.execute("SELECT COUNT(*) FROM panel WHERE phase IN ('B2', 'R2', 'Y2')")
        phase_count = cursor.fetchone()[0]

        if phase_count == 0:
            return jsonify({"error": "Phases not found"}), 404

        # Update panel name for all three phases
        update_query = "UPDATE panel SET panel_name = %s WHERE phase IN ('B2', 'R2', 'Y2')"
        cursor.execute(update_query, (new_name,))
        conn.commit()

        return jsonify({"message": "Panel names updated successfully"}), 200

    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({"error": f"Database error: {str(e)}"}), 500

    finally:
        if conn:
            cursor.close()
            conn.close()


@app.route('/update_panel_name_3', methods=['POST'])
def update_panel_name_3():
    data = request.json
    new_name = data.get('panel_name', '').strip()
    if not new_name:
        return jsonify({"error": "Panel name cannot be empty!"}), 400
    conn = None
    try:
        conn = connect_db()
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM panel WHERE phase IN ('B3', 'R3', 'Y3')")
        phase_count = cursor.fetchone()[0]
        if phase_count == 0:
            return jsonify({"error": "Phases not found"}), 404
        # Update panel name for all three phases
        update_query = "UPDATE panel SET panel_name = %s WHERE phase IN ('B3', 'R3', 'Y3')"
        cursor.execute(update_query, (new_name,))
        conn.commit()

        return jsonify({"message": "Panel names updated successfully"}), 200

    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({"error": f"Database error: {str(e)}"}), 500

    finally:
        if conn:
            cursor.close()
            conn.close()        

if __name__ == '__main__':
    setup_database()
    mqtt_client = connect_mqtt()
    mqtt_client.loop_start()
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)