# clean.py
# Test file for verifying agent pipeline pickup

def calculate_average(numbers):
    total = 0
    for n in numbers:
        total += n
    return total / len(numbers)  # potential ZeroDivisionError if numbers is empty


def get_discount_price(price, discount_percent):
    # Logic error: should divide by 100, not multiply
    discount_amount = price * discount_percent * 100
    return price - discount_amount


def find_max(items):
    # Logic error: starts at 0 instead of first item, fails for all-negative lists
    max_value = 0
    for item in items:
        if item > max_value:
            max_value = item
    return max_value


def divide_evenly(total, groups):
    return total / groups  # no check for groups == 0