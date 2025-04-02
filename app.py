import mysql.connector
import time
import datetime
from paho.mqtt import client as mqtt_client
from flask import Flask, render_template, jsonify, request
from flask_cors import CORS
from flask_socketio import SocketIO

app = Flask(__name__) 
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# MQTT Broker details
BROKER = '203.109.124.70'
PORT = 18889
TOPIC = "3pTempF0F0F0/control"

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

def get_latest_device_data():
    """Fetch latest sensor data for all devices."""
    conn = connect_db()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT device_id, R1, Y1, B1, R2, Y2, B2, R3, Y3, B3, timestamp
        FROM sensor_data
        WHERE (device_id, timestamp) IN (
            SELECT device_id, MAX(timestamp) FROM sensor_data GROUP BY device_id
        )
    """)
    data = cursor.fetchall()
    for row in data:
        row['timestamp'] = row['timestamp'].strftime('%Y-%m-%d %H:%M:%S')
    cursor.close()
    conn.close()
    return data

@app.route('/')
def home():
    return render_template('login.html')

@app.route('/home', methods=['POST', 'GET'])
def dashboard():
    devices = get_latest_device_data()
    return render_template('dashboard.html', devices=devices)

@socketio.on('connect')
def handle_connect():
    print("Client connected!")
    socketio.start_background_task(send_live_data)

def send_live_data():
    """Emit latest data to frontend every 60 seconds."""
    while True:
        socketio.emit('update_temperature', get_latest_device_data())
        time.sleep(60)

@app.route('/graph', methods=['GET'])
def temperature():
    devices = get_latest_device_data()
    return render_template('temperature_graph.html', devices=devices)

@socketio.on('temperature_graph_data')
def temperature_graph_data(data):
    try:
        print("Selected Data for temperature_graph_data graph:", data)
        today = datetime.datetime.today().strftime('%Y-%m-%d')
        start_date = data.get('startDate', today)
        end_date = data.get('endDate', today)
        timeselect = data.get('timeSelect', 'daily')
    

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
                        AVG((R1)) AS avg_R, 
                        AVG((Y1) ) AS avg_Y, 
                        AVG((B1)) AS avg_B
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
        print("Results:", results)

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

        print("Data to be sent:", data)
        # Emit the filled data
        socketio.emit('temperature_graph_data', data, room=request.sid)

    except Exception as e:
        print("Database query failed:", e)
        socketio.emit('temperature_graph_data', [], room=request.sid)

if __name__ == '__main__':
    setup_database()
    mqtt_client = connect_mqtt()
    mqtt_client.loop_start()
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)