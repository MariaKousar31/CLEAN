# inventory.py
# Test file for pipeline demo — intentional bugs

import os


def get_user_data(user_id):
    # Bug: SQL injection risk — string formatting directly into query
    query = "SELECT * FROM users WHERE id = " + user_id
    return query


def load_config(filename):
    # Bug: no error handling if file doesn't exist
    file = open(filename, "r")
    data = file.read()
    return data


def calculate_total_price(items):
    # Bug: mutable default argument (classic Python pitfall)
    def add_tax(price, taxes=[]):
        taxes.append(price * 0.1)
        return sum(taxes)
    
    total = 0
    for item in items:
        total += add_tax(item["price"])
    return total


def get_api_key():
    # Bug: hardcoded fallback secret-like value (should trip Secret Scanner too)
    key = os.environ.get("API_KEY", "sk_test_default12345")
    return key


def process_items(items, index):
    # Bug: no bounds checking — IndexError risk
    return items[index] * 2


class ShoppingCart:
    def __init__(self):
        self.items = []
    
    def remove_item(self, item_name):
        # Bug: modifying list while iterating over it
        for item in self.items:
            if item == item_name:
                self.items.remove(item)