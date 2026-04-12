pipeline {
    agent any
    
    environment {
        DOCKER_USER = credentials('dockerhub-username')
        DOCKER_PASS = credentials('dockerhub-password')
        FRONTEND_IMAGE = "${DOCKER_USER}/chaosops-frontend:latest"
        BACKEND_IMAGE = "${DOCKER_USER}/chaosops-backend:latest"
    }

    stages {
        stage('Checkout') {
            steps {
                echo 'Checking out source code...'
                checkout scm
            }
        }
        
        stage('Build & Test') {
            steps {
                echo 'Building Frontend...'
                sh 'npm install && npm run build'
                
                echo 'Building Backend...'
                dir('backend') {
                    sh 'npm install'
                }
            }
        }
        
        stage('Docker Build & Push') {
            steps {
                echo 'Authenticating with Docker Hub...'
                sh 'echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin'
                
                echo 'Building and Pushing Frontend...'
                sh "docker build -t ${FRONTEND_IMAGE} ."
                sh "docker push ${FRONTEND_IMAGE}"
                
                echo 'Building and Pushing Backend...'
                dir('backend') {
                    sh "docker build -t ${BACKEND_IMAGE} ."
                    sh "docker push ${BACKEND_IMAGE}"
                }
            }
        }

        stage('Deploy via Ansible') {
            steps {
                echo 'Triggering Ansible Deployment...'
                dir('ansible') {
                    sh 'ansible-playbook deploy-infrastructure.yml'
                }
            }
        }
    }
}
