# DSS-OPDC-Pipeline-flow

for usage follow the steps:

1. install python>= 3.8

2. go to the project directory (DSS folder) and run command:
	- python -m venv venv


3. activate the virtual environment:
	- source venv/bin/activate (on linux)
	- venv/bin/activate.batch (windows I guess)


4. install requirements using the following commands:
	- pip install -r requirements.txt

5. run the following command:
	- python manage.py makemigrations
	- python manage.py migrate

6. run the server:
	- python manage.py runserver localhost:8000


7. open browser and go to http://localhost:8000/


Voila ! ! !
