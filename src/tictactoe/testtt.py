	#  1. When reading the value of a variable, we need to be careful about the variable's type. 
    # For example, *in Python*, if `a = 3` and `b = "123"`, what is `a * b`?


a = 3
b = '123'

ab = a * b
print(ab)  #'123123123'


# You are building a system in Python to track inventory at an auto-parts store. 
# Each part has a definite number of string tags that describe its qualities such as "red", "aluminum", and "heavy-duty". 
# The strings for each part are pre-defined by the manufacturer and do not change. 
# The number of strings is different for each part. 
# What data structure would you choose to store this property?
# Tuple

# I have two lists such that each list contains no repeated elements. 
# However, the lists do share some elements, and I want to combine the lists such that no elements are repeated. 
# For example, if `list_1` is  `[1,2,4]` and `list_2` is `[1,3,5]`, then the combined list should be `[1,2,4,3,5]`, 
# not `[1,2,4,1,3,5]`. Of the choices below, which code will accomplish this? 
# *Note: the order of the elements in the resulting list does not matter as long as there are no duplicates.

list_1 = [1,2,4]
list_2 = [1,3,5]

list_1.extend(list_2)
combine = list(set(list_1))
print(combine)

# What code should replace the section reading “FILL ME IN” that will override the `fun` method 
# so that when an instance of the `Child` class has the `fun` method called it returns `"Bye"` instead of `"Hi"`? 
# ```python class Parent(object):    def fun(self):       print(‘Hi’) >>> p = Parent() >>> p.fun() Hi ``` 
# ```python class Child(Parent): "FILL ME IN" >>> c = Child() >>> c.fun() Bye ```

class Parent(object):
    def fun(self):
        print('Hi')

p = Parent()
p.fun()

class Child(Parent):
    def fun(self):
        print('Bye')

c = Child()
c.fun()

# time efficient 
# https://app.codesignal.com/public-test/Ga4ZmgGztLqebSzxB/si7rDMnBb4r9Hn
#operation 2
# With linked lists, adding/removing elements is technically cheaper in comparison. 

# Which of the following pairs of classes are most likely to be implemented with an association ("has-a") relationship?
# Canine Dog

# Below is an example implementation of the binary search algorithm in Python: 
# ```python def binary_search(item_list, item): first = 0 last = len(item_list) - 1 
# while first <= last: mid = first + (last - first) // 2 if item_list[mid] == item : 
# return True else: if item < item_list[mid]: last = mid - 1 else: first = mid + 1 
# return False ``` What must be true for this algorithm to work?

def binary_search(item_list, item):
    first = 0 
    last = len(item_list) - 1
    while first <= last:
        mid = first + (last - first) // 2

        if item_list[mid] == item :
            return True
        else:
            if item < item_list[mid]:
                last = mid - 1
            else:
                first = mid + 1 
            return False

test = [2,4,5,6,7,8,9,10,12,11]  # must be sorted direction doesn't matter
col = binary_search(test, 7)  
print(col)

            

# Consider this recursive insertion sort algorithm in Python. 
# ```python def insertionSortRecursive(arr,n): # Comment A if ????: 
# return insertionSortRecursive(arr,n-1) last = arr[n-1] j = n-2 while (j>=0 and arr[j]>last): 
# arr[j+1] = arr[j] j = j-1 arr[j+1]=last ``` The base case is missing under 
# `# Comment A`. Which code should replace the question marks?

def insertRe(arr, n):
    if n <= 1:
        return;
    insertRe(arr, n-1)
    last = arr[n-1]
    j = n-2
    while (j>=0 and arr[j] > last):
        arr[j+1] = arr[j]
        j = j - 1

    arr[j+1] = last


arr = [1,2,3,4]
n = 1
col = insertRe(arr, n)
print(col)
# n <= 1

# Find the big-O running time of a sorting program that does the following: - 
# It takes in a list of integers. - It iterates once through the list to find the smallest element, 
# and moves that element to the end (by removing the value from the list and adding it 
# to the back of the list). - It repeatedly finds the smallest element in the unsorted 
# portion by iterating once through, and moves that element to the end of the unsorted 
# portion. At the end, the list is sorted low to high.

# o(n^2)

# You are writing a function that manages the help tickets that your customer service team receives. The oldest tickets should be answered first. Which line(s) of code show the best way of approaching the problem?
# tickets = DoublyLinkedList()
# tickets.add_to_tail(new_ticket)
    
# Which of the insertion sequences **cannot** produce the binary search tree below? ![Binary Search Tree Example]


# Which of the following is the **best** way to implement a `__str__()` 
# method for `Llama`? ```python class Animal: def __init__(self, age, gender): '
# # code not shown class Llama (Animal): def __init__(self, height, is_domesticated):
#  # code not shown def __str__(self): # FILL ME IN ```

class Animal: 
    def __init__(self, age, gender):
        # code not shown class Llama
        pass
class Llama (Animal): 
    def __init__(self, height, is_domesticated):
        # code not shown
        pass
    
    def __str__(self):
        # FILL ME IN ```
        return f'{super().__str__()}, {self.height} in. tall'


# Author(first, last)
# dog/owner

