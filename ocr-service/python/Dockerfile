# Use an official Python runtime as a parent image
FROM python:3.11

# Set the working directory in the container
WORKDIR /app

# Install system dependencies required for OpenCV and other tools
RUN apt-get update && apt-get install -y \ 
    libgl1-mesa-glx \
    libglib2.0-0 \
    tesseract-ocr \
    gunicorn3 \
    tk \
    libavcodec-dev libavformat-dev libswscale-dev \
    libjpeg-dev libpng-dev libtiff-dev \
    libx264-dev \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Copy the requirements file into the container
COPY requirements.txt .

# Install Python dependencies
RUN pip install -r requirements.txt

# Copy the rest of the application files
COPY . .

# Create necessary directories for file uploads and output
RUN mkdir -p /app/uploads /app/output

# Expose the port the app runs on
EXPOSE 8080

# Set environment variables for Flask
ENV FLASK_APP=app-staging.py
ENV FLASK_RUN_HOST=0.0.0.0
ENV PORT=8080

# Run the Flask app with Gunicorn (multi-threaded and worker configuration)
CMD exec gunicorn --bind :$PORT --workers 1 --worker-class gthread --threads 8 --timeout 0 app-staging:app