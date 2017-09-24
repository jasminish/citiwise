import time
import json 
import requests
import urllib

from dbhelper import DBHelper
db = DBHelper()

TOKEN = "361332687:AAHNxdb6umMMavU0maaiwr_ygqg37TP_F6c"
URL = "https://api.telegram.org/bot{}/".format(TOKEN)


def get_url(url):
    response = requests.get(url)
    content = response.content.decode("utf8")
    return content


def get_json_from_url(url):
    content = get_url(url)
    js = json.loads(content)
    return js

def get_updates(offset=None):
    url = URL + "getUpdates?timeout=100"
    if offset:
        url += "&offset={}".format(offset)
    js = get_json_from_url(url)
    return js

def get_last_update_id(updates):
    update_ids = []
    for update in updates["result"]:
        update_ids.append(int(update["update_id"]))
    return max(update_ids)

def handle_updates(updates):
    for update in updates["result"]:
        name = update["message"]["from"]["first_name"]
        text = update["message"]["text"]
        chat = update["message"]["chat"]["id"]
            
        # items = db.get_items(chat)  ##
        if text == "/start":
            send_message("Please login to your Citi account: https://127.0.0.1:3000/login", chat)
        elif text == "/start ready":
            send_message("Hey " + name + ", your spending for this month is $1660.85 so far! ", chat)
            time.sleep(15.0)

            send_message("The only exercise some people get is running out of money! What about you " + name + " It looks like your balance has been pretty healthy! You have spent $1660.85 this month so far! I predict that you will be spending $961.54 for the rest of the month!", chat)
            time.sleep(15.0)

            send_message("It looks like your balance has been pretty healthy! " +
                "You have spent $1660.85 on your Citi® / AAdvantage® Platinum Select® World Elite™ MasterCard® this month so far! I predict that you will be spending another $961.54 for the rest of the month! ", chat)
            time.sleep(15.0)

            send_message("Money isn’t the most important thing in the world but it ranks pretty close to oxygen on the ‘gotta have it’ scale! What about you, " + name + "? It looks like your balance has been pretty healthy! You have spent $1660.85 this month so far! I predict that you will be spending $961.54 for the rest of the month!", chat)
            time.sleep(15.0)

            send_message("Hi " + name + ", I realized you recently used the CitiBusiness®/ AAdvantage® Platinum Select®World Mastercard for Dining & Entertainment, but I also noticed you have our Citi ThankYou® Preferred Card! Try using it next time to get better rewards!", chat)


def get_last_chat_id_and_text(updates):
    num_updates = len(updates["result"])
    last_update = num_updates - 1
    text = updates["result"][last_update]["message"]["text"]
    chat_id = updates["result"][last_update]["message"]["chat"]["id"]
    return (text, chat_id)


def send_message(text, chat_id, reply_markup=None):
    text = urllib.parse.quote_plus(text)
    url = URL + "sendMessage?text={}&chat_id={}&parse_mode=Markdown".format(text, chat_id)
    if reply_markup:
        url += "&reply_markup={}".format(reply_markup)
    get_url(url)

def build_keyboard(items):
    keyboard = [[item] for item in items]
    print(keyboard)
    reply_markup = {"keyboard":keyboard, "one_time_keyboard": True}
    return json.dumps(reply_markup)

def main():
    db.setup()
    last_update_id = None
    while True:
        print("getting updates")
        updates = get_updates(last_update_id)
        if len(updates["result"]) > 0:
            last_update_id = get_last_update_id(updates) + 1
            handle_updates(updates)
        time.sleep(0.5)

if __name__ == '__main__':
    main()
