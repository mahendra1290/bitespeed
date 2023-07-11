# Identity Reconciliation

you can test it [here](http://ec2-3-109-54-99.ap-south-1.compute.amazonaws.com/identify)

endpoint: <http://ec2-3-109-54-99.ap-south-1.compute.amazonaws.com/identify>

My resume [here](https://drive.google.com/file/d/1p5Uw9JBF9qozrO-1XmVb996YtVuO3KrF/view?usp=sharing)

## Setup

Make sure your postgres server is running before running this

Clone the repo

```(bash)
git clone https://github.com/mahendra1290/bitespeed.git
```

Change directory

```(bash)
cd bitespeed
```

Install the dependencies

```(bash)
npm install
```

Create .env file from .env.example and add the required variables

```(bash)
cp .env.examle .env
```

Run the server

```bash
npm run dev
```

## Running tests

Create .env.test.local this env will be used for testing

```(bash)
cp .env.example .env.test.local
```

Run tests

```(bash)
npm run test
```

## Running using docker

Build the images

```(bash)
docker compose build
```

Start the services

```(bash)
docker compose up
```

It will expose the PORT 80 by default you can change it by editing the docker-compose.yml

visit <http:localhost/identify>
