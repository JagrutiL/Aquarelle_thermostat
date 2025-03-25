import mysql.connector
import time
import datetime
import random
from paho.mqtt import client as mqtt_client
import threading
from flask import Flask, render_template, jsonify, request, url_for, redirect,make_response,session, flash
from flask_cors import CORS
from flask_socketio import SocketIO,emit

app = Flask(__name__) 
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# MQTT Broker details
broker = 'broker.emqx.io'
port = 1883
topic = "3pTemp/control"

# MySQL Database connection details
db_config = {
    "host": "localhost",  # Change if MySQL is hosted elsewhere
    "user": "root",       # Your MySQL username
    "password": "root",  # Your MySQL password
    "database": "mqtt_data"
}

# Create MySQL database and table (run once)
def setup_database():
    conn = mysql.connector.connect(host=db_config["host"], user=db_config["user"], password=db_config["password"])
    cursor = conn.cursor()
    cursor.execute("CREATE DATABASE IF NOT EXISTS mqtt_data")
    cursor.execute("USE mqtt_data")
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
    print("✅ Database and Table Setup Complete")

# Connect to MySQL database
def connect_db():
    return mysql.connector.connect(**db_config)

# MQTT Connection Function
def connect_mqtt():
    def on_connect(client, userdata, flags, rc):
        if rc == 0:
            print("✅ Connected to MQTT Broker!")
            client.subscribe(topic)
        else:
            print(f"❌ Failed to connect, return code {rc}")
    
    client = mqtt_client.Client()
    client.on_connect = on_connect
    client.on_message = on_message
    client.connect(broker, port)
    return client

# Callback when message is received
def on_message(client, userdata, msg):
    if msg.topic.startswith("3pTemp"):
        payload = msg.payload.decode()
        print(f"📩 Received `{payload}` from `{msg.topic}`")
        
        try:
            data = payload.strip("{} ").split(":")
            device_id = data[1]
            R1, Y1, B1 = float(data[2]), float(data[3]), float(data[4])
            R2, Y2, B2 = float(data[5]), float(data[6]), float(data[7])
            R3, Y3, B3 = float(data[8]), float(data[9]), float(data[10])
            alert_flag = int(data[11])
            
            insert_data(device_id, R1, Y1, B1, R2, Y2, B2, R3, Y3, B3, alert_flag)
        except Exception as e:
            print(f"❌ Error parsing message: {e}")
    else:
        print(f"⚠️ Ignored message from topic `{msg.topic}`")

# Insert Data into MySQL
def insert_data(device_id, R1, Y1, B1, R2, Y2, B2, R3, Y3, B3, alert_flag):
    conn = connect_db()
    cursor = conn.cursor()
    sql = """
        INSERT INTO sensor_data (device_id, R1, Y1, B1, R2, Y2, B2, R3, Y3, B3, alert_flag, timestamp)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """
    values = (device_id, R1, Y1, B1, R2, Y2, B2, R3, Y3, B3, alert_flag, datetime.datetime.now())
    cursor.execute(sql, values)
    conn.commit()
    cursor.close()
    conn.close()
    print("✅ Data Inserted into MySQL")

# Generate and publish dummy data every 60 seconds
def publish_dummy_data(client):
    while True:
        device_id = f"3pTempF0BF{random.randint(1, 10)}"
        R1, Y1, B1 = round(random.uniform(25, 45), 2), round(random.uniform(25, 45), 2), round(random.uniform(25, 45), 2)
        R2, Y2, B2 = round(random.uniform(25, 45), 2), round(random.uniform(25, 45), 2), round(random.uniform(25, 45), 2)
        R3, Y3, B3 = round(random.uniform(25, 45), 2), round(random.uniform(25, 45), 2), round(random.uniform(25, 45), 2)
        alert_flag = random.randint(0, 1)
        
        msg = f"{{device_id:{device_id}:{R1}:{Y1}:{B1}:{R2}:{Y2}:{B2}:{R3}:{Y3}:{B3}:{alert_flag}}}"
        result = client.publish(topic, msg)
        
        if result.rc == mqtt_client.MQTT_ERR_SUCCESS:
            print(f"✅ Published `{msg}` to `{topic}`")
        else:
            print(f"❌ Failed to publish message to `{topic}`")
        
        time.sleep(60)  # Wait 60 seconds before publishing again

# Run the subscriber and dummy publisher
def run():
    setup_database()
    client = connect_mqtt()
    client.loop_start()
    # publish_dummy_data(client)  # Start publishing dummy data every 60 seconds
    # Run publisher in a separate thread
    publisher_thread = threading.Thread(target=publish_dummy_data, args=(client,))
    publisher_thread.daemon = True
    publisher_thread.start()

@app.route('/')
def home():
    return render_template('login.html')

@app.route('/home', methods=['POST', 'GET'])
def dashboard():
    return render_template('dashboard.html')

def get_latest_device_data():
    conn = connect_db()
    cursor = conn.cursor(dictionary=True)
    # cursor.execute("""
    #     SELECT device_id, R1, Y1, B1, R2, Y2, B2, R3, Y3, B3, timestamp
    #     FROM sensor_data AS sd
    #     WHERE timestamp = (
    #         SELECT MAX(timestamp) 
    #         FROM sensor_data 
    #         WHERE sensor_data.device_id = sd.device_id
    #     )
    #     ORDER BY timestamp DESC;
    # """)
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

    print("✅ Fetched Latest Data", data) 
    cursor.close()
    conn.close()
    return data

@socketio.on('connect')
def handle_connect():
    print("Client connected!")
    socketio.start_background_task(send_live_data)

def send_live_data():
    while True:
        socketio.emit('update_temperature', get_latest_device_data())
        time.sleep(60)  # Emit every 60 seconds

@app.route('/graph', methods=['GET'])
def temperature():
    devices = get_latest_device_data()  # Fetch latest data from DB
    return render_template('temperature_graph.html', devices=devices)



if __name__ == '__main__':
    run()
    socketio.run(app, host='0.0.0.0', port=5000,debug=True)
