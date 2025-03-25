import random
import time
from paho.mqtt import client as mqtt_client
      
broker = 'broker.emqx.io'
port = 1883
topic = "3pTemp/control"

# client_id = f'publish-{random.randint(0, 1000)}'


def connect_mqtt():
    def on_connect(client, userdata, flags, rc):
        if rc == 0:
            print("✅ Connected to MQTT Broker!")
        else:
            print(f"❌ Failed to connect, return code {rc}")

    # ✅ FIX: Removed `callback_api_version`
    client = mqtt_client.Client()
    client.on_connect = on_connect
    client.connect(broker, port)
    return client


def publish(client):
    while True:
        random_id = random.randint(1, 10)  # Two-digit device number
        device_name = f'3pTempF0BF{random_id}'

        # Generating 9 random float values for R, Y, B
        R1, Y1, B1 = round(random.uniform(25, 45), 2), round(random.uniform(25, 45), 2), round(random.uniform(25, 45), 2)
        R2, Y2, B2 = round(random.uniform(25, 45), 2), round(random.uniform(25, 45), 2), round(random.uniform(25, 45), 2)
        R3, Y3, B3 = round(random.uniform(25, 45), 2), round(random.uniform(25, 45), 2), round(random.uniform(25, 45), 2)

        alert_flag = random.randint(0, 1)  # 0 or 1 for alert

        # ✅ Creating message in requested format
        msg = f"{{device_id:{device_name}:{R1}:{Y1}:{B1}:{R2}:{Y2}:{B2}:{R3}:{Y3}:{B3}:{alert_flag}}}"

        # ✅ Publish Message
        result = client.publish(topic, msg)

        if result.rc == mqtt_client.MQTT_ERR_SUCCESS:
            print(f"✅ Sent `{msg}` to topic `{topic}`")
        else:
            print(f"❌ Failed to send message to topic {topic}")

        time.sleep(60)


def run():
    client = connect_mqtt()
    client.loop_start()

    try:
        publish(client)
    except KeyboardInterrupt:
        print("\n❌ Stopping MQTT Publisher")
    finally:
        client.loop_stop()
        client.disconnect()  # ✅ Ensure proper cleanup


if __name__ == '__main__':
    run()
