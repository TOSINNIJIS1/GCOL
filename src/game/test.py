# a = 3
# b = '123'

# result = a * b
# print(result)

list_1 = [1,2,4]
list_2 = [1,3,5]

# combined = [element in list_1.extend(list_2) if element not in combined]

# combine = list(set(list_1.extend(list_2)))
# print(combine)

# list_1.extend(list_2)
# combine = set(list_1)
# print(combine)

list_1.extend(list_2)
combine = list(set(list_1))
print(combine)

# class Parent(object):
#     def fun(self):
#         print('Hi')

# p = Parent()
# p.fun()


# class Child(Parent):
#     def fun(self):
#         print('Bye')
# c = Child()
# c.fun()


def bst(item_list, item):
    first = 0
    last = len(item_list) - 1
    while first <= last:
        mid = first + (last - first) // 2
        if item_list[mid] == item:
            return True
        else:
            if item < item_list[mid]:
                last = mid - 1
            else:
                first + 1
    return False

col = bst([2], 2)  # Must have more than 2 elements or value to be true
print(col)


# def insertRe(arr, n):
    # if n <= 1:
    #     return;
    # insertRe(arr, n-1)
    # last = arr[n-1]
    # j = n-2
    # while (j>=0 and arr[j] > last):
    #     arr[j+1] = arr[j]
    #     j = j - 1

    # arr[j+1] = last


# arr = [1,2,3,4]
# n = 1
# col = insertRe(arr, n)
# print(col)
# 


# def print_lyrics():                                   #Header
#     # for i in range(4):                              #Body
#     print("Oh yeah, I'll tell you something")         #Body
#     print("I think you'll understand")                #Body
#     print("Then I'll say that something")             #Body
#     print("I wanna hold your hand")                   #Body
# print_lyrics()                                        #Call Function

# For
# Anytime we want to repeat the same statement multiple times, we can do concisely by using a for statement.

# def for_loop():
#     for i in range(4):
#         print('Hey')
#         print('bang')
#     return

# for_loop()

# Boolean Expressions
# A boolean expression is an expression that is true or false. True and False are special values that are of type bool, they are not strings.
# The == operator is a relational operator (Not to be confused with = which is an assignment operator.). Here are the other relational operators:

# Relational Operator	Explanation
# x != y	# x is not equal to y
# x > y	    # x is greater thany
# x < y	    # x is less thany
# x >= y	# x is greater than or equal to y
# x <= y	# x is less than or equal to y

# is2 = 2 == 2        # is2 equals 2 is equal to 2
# print(is2)          # True 2 is equal to 2
# is3 = 3 == 3        # is3 equals 3 is equal to 3
# print(is3)          # True 3 is equal to 3
# fouris5 =  4 == 5   # fouris5 equals 4 is equal to 5
# print(fouris5)      # False 4 is not equal to 5


# Logical Operators
# Python has three logical operators: and, or, and not.

# true = True and True
# print(true)

# false = True and False
# print(false)

# ffalse = False and False
# print(ffalse)

# Conditional Execution
# The simplest and most common way to do that is by using an if statement:
# def x():
#     x = -21
#     if x < 0:
#         print('x is negative')
# x()


# Alternative Execution
# Often, in your code, you have two distinct possibilities and you want the condition to determine which behavior occurs. To do that, you would write:

# def x():
#     x = 21
#     if x < 0:
#         print('x is negative')
#     else:
#         print('x is positive')
# x()

# Chained Conditionals
# What if there are more than two distinct possibilities? One way to deal with this is to use a chained conditional:

# def xandy():
#     x = 22
#     y = 22
#     if x < y:
#         print('x is less than y')
#     elif x > y:
#         print('x is greater than y')
#     else:
#         print('x and y are equal')
# xandy()

# Nested Conditionals
# You can always nest conditionals within other conditionals. For example, we could rewrite the previous chained conditional example like so:

# def xandy():
#     x = 22
#     y = 22
#     if x < y:
#         print('x is less than y')
#     else:
#         if x > y:
#             print('x is greater than y')
#         else:
#             print('x and y are equal')
# xandy()


# Short-Circuit Evaluation
# When writing conditionals, it’s useful to understand how the ordering of your statements matters. For instance, let’s say we are checking if a number is five (albeit in a contrived way):

# def is_five(n):
#     # If n is 0, the `and` will return immediately
#     # avoiding the division by 0 error
#     return n != 0 and 4 / n == 1  # if n is 0 then it will return false if not then, if 5 is divided by any given number is equal to 1 then it's going to be true. 5/5 can only give 1

# print(is_five(4))


# def right_justify(s):
#     return ((90 - len(s)) * '' ) + s

# print(right_justify('lambda'))

# How many seconds are there in 21 minutes and 15 seconds?


# def seconds(min, sec):
#     second = 1
#     minute = second * 60
#     if min and sec:
#         return (min * minute) + (second * sec)
        

# print(seconds(21, 15))

# Object Oriented Programming
# The Four Pillars of OOP
# The four pillars of OOP are:

# Encapsulation the implementation details of an object is called encapsulation.
# Abstraction means dealing with the level of detail that is most appropriate to a task.
# Inheritence describes the relationship where, “The dog is an animal” or where “The teacher is an employee”.
# Inheritance is like a family tree. A person could say that they inherited their last name and their brown eyes from their grandfather. Similarly, inheritance allows our object classes to inherit attributes and methods from other classes in the program.
# Polymorphism is the ability to treat a class differently depending on which subclass is implemented.

# class User:
#     def __init__(self, name, is_admin=False):
#         self.name = name
#         self.is_admin = is_admin

# class Admin(User):
#     def __init__(self, name):
#         super().__init__(name, is_admin=True)

# class Customer(User):
#     def __init__(self, name):
#         super().__init__(name)
#         self.purchases = []

# class Vendor(User):
#     def __init__(self, name):
#         super().__init__(name)
#         self.products = []



# class Rectangle:
#     def __init__(self, length, width):
#         self.length = length
#         self.width = width

#     def area(self):
#         return self.length * self.width

#     def perimeter(self):
#         return 2 * self.length + 2 * self.width

# class Square:
#     def __init__(self, length):
#         self.length = length

#     def area(self):
#         return self.length * self.length

#     def perimeter(self):
#         return 4 * self.length

# Reduce Code
class Rectangle:
    def __init__(self, length, width):
        self.length = length
        self.width = width

    def area(self):
        return self.length * self.width

    def perimeter(self):
        return 2 * self.length + 2 * self.width

# Here we declare that the Square class inherits from the Rectangle class
class Square(Rectangle):
    def __init__(self, length):
        super().__init__(length, length)

square = Square(4)
print(square.area())

rectangle = Rectangle(2,4)
print(rectangle.area())