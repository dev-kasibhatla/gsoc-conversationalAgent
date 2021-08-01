import socket

#rasa server
sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
r1 = sock.connect_ex(('localhost', 5002))
#action server
sock2 = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
r2 = sock2.connect_ex(('localhost', 5055))
print(r1,r2)
