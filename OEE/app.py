"""Ponto de entrada: `flask --app app run` ou `gunicorn app:app`."""
from oee import create_app

app = create_app()

if __name__ == "__main__":
    app.run(debug=True)
