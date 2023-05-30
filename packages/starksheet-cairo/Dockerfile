# pull official base image
FROM python:3.9.16-slim-buster

# set work directory in the container
WORKDIR /app

# set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# install system dependencies
RUN apt-get update && apt-get install -y gcc libgmp-dev

# install python dependencies
RUN pip install --upgrade pip
RUN pip install poetry

# copy project
COPY . /app/

# install dependencies
RUN poetry install --no-interaction --no-ansi

# command to run on container start
CMD ["poetry", "run", "python", "deploy/starksheet.py"]
