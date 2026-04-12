## CODE IMPLEMENTATION

Here is the comprehensive code implementation mapped directly to your requested structure, fully tailored to the ChaosOps project source code (React/Node.js stack) deployed via Terraform and Ansible.

### 1. Dockerfile
The Dockerfiles are used to containerize the React ChaosOps frontend application and the backend Node.js API. Below is the multi-stage build used to compile the React code and serve it via an efficient NGINX distribution.

```dockerfile
# ───────────────────────────────────────────── 
# Dockerfile — ChaosOps React Frontend Web App
# Stage 1: Build the dist payload
# ─────────────────────────────────────────────

FROM node:18 AS build

# Set the working directory inside the container
WORKDIR /app

# Copy only requirements first (for layer caching)
COPY package*.json ./

# Install Javascript dependencies
RUN npm install

# Copy the rest of the application source code 
COPY . .

# Generate the static Vite build payload
RUN npm run build

# ───────────────────────────────────────────── 
# Stage 2: Serve using an Alpine Linux Nginx host
# ─────────────────────────────────────────────
FROM nginx:alpine

# Copy the build artifact from Stage 1 into the NGINX host directory
COPY --from=build /app/dist /usr/share/nginx/html

# Replace the default Nginx config with our custom proxy setup
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80 (HTTP default)
EXPOSE 80

# Keep NGINX running in the foreground to prevent container exit
CMD ["nginx", "-g", "daemon off;"]
```

---

### 2. Kubernetes YAML Configurations
*(Note: While ChaosOps leverages Terraform to orchestrate Kubernetes configurations dynamically, here are the equivalent declarative Kubernetes YAML representations of the ChaosOps enterprise architecture).*

#### **deployment.yaml**
```yaml
# ───────────────────────────────────────────────────── 
# kubernetes/deployment.yaml
#
# A Kubernetes Deployment tells the cluster: 
# - What container image to run
# - How many replicas (copies) to maintain
# ─────────────────────────────────────────────────────

apiVersion: apps/v1
kind: Deployment
metadata:
  name: chaosops-frontend
  namespace: chaosops
  labels:
    app: chaosops-frontend
spec:
  replicas: 2
  selector:
    matchLabels:
      app: chaosops-frontend
  template:
    metadata:
      labels:
        app: chaosops-frontend
    spec:
      containers:
      - name: frontend
        image: chaosops-app:latest
        imagePullPolicy: Never
        ports:
        - containerPort: 80
        resources:
          requests:
            memory: "64Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "500m"
```

#### **service.yaml**
```yaml
# ───────────────────────────────────────────────────── 
# kubernetes/service.yaml
#
# A Kubernetes Service exposes the pods to external traffic. 
# NodePort exposes the service on each node's IP at a fixed port.
# NodePort 30007 means: http://<node-ip>:30007 reaches the React interface.
# ─────────────────────────────────────────────────────

apiVersion: v1
kind: Service
metadata:
  name: chaosops-frontend
  namespace: chaosops
spec:
  type: NodePort
  selector:
    app: chaosops-frontend
  ports:
    - protocol: TCP
      port: 80
      targetPort: 80
      nodePort: 30007
```

#### **configmap.yaml**
```yaml
# ───────────────────────────────────────────────────── 
# kubernetes/configmap.yaml
#
# A ConfigMap stores non-sensitive configuration as
# key-value pairs that pods can read as environment vars. 
# ─────────────────────────────────────────────────────

apiVersion: v1
kind: ConfigMap
metadata:
  name: chaosops-config
  namespace: chaosops
data:
  # Internal Cluster DNS resolution for MongoDB injection
  MONGO_URI: "mongodb://chaosops-mongo:27017/ChaosOpsStats"
  # Environment designation
  NODE_ENV: "production"
  # Application Identifier
  APP_NAME: "ChaosOps Enterprise Control Plane"
```

---

### 3. Ansible Playbook
Ansible automates the invocation of the underlying Terraform modules to completely script the cloud provisioning tasks without manual intervention.

#### **inventory.ini**
```ini
# ─────────────────────────────────────────────────────
# ansible/inventory.ini 
# This file tells Ansible WHICH servers to connect to. 
# For the ChaosOps pipeline, it executes on the local CI/CD daemon.
# ─────────────────────────────────────────────────────

[local]
localhost ansible_connection=local

[all:vars]
ansible_python_interpreter=/usr/bin/python3
```

#### **playbook.yml**
```yaml
# ─────────────────────────────────────────────────────
# ansible/deploy-infrastructure.yml 
# This Ansible playbook automates the staging of the Terraform scripts.
# ─────────────────────────────────────────────────────

---
- name: Deploy ChaosOps Enterprise Infrastructure
  hosts: local
  gather_facts: false

  tasks:
    - name: Ensure Terraform is initialized
      command: terraform init
      args:
        chdir: ../terraform/
      register: tf_init
      changed_when: "'Terraform has been successfully initialized!' in tf_init.stdout"

    - name: Output Terraform Init Status
      debug:
        msg: "{{ tf_init.stdout_lines }}"

    - name: Apply Terraform Configuration to Kubernetes
      command: terraform apply -auto-approve
      args:
        chdir: ../terraform/
      register: tf_apply
      changed_when: "'Apply complete!' in tf_apply.stdout"

    - name: Verify ChaosOps Namespace
      command: kubectl get namespace chaosops
      register: ns_status
      failed_when: ns_status.rc != 0
      changed_when: false

    - name: Success Message
      debug:
        msg: "✅ Enterprise ChaosOps deployment successful managed via Ansible!"
```

---

### 4. GitHub Actions Workflow
The CI/CD pipeline triggers upon pushes to the main branch. It conducts build validation on the Node.js application components before securely pushing the images to Docker Hub.

#### **.github/workflows/ci-cd.yml**
```yaml
# ───────────────────────────────────────────────────── 
# GitHub Actions CI/CD Pipeline — ChaosOps App
# Triggers on push/PR to main branch
# Stages: Build & Test → Docker Image Push
# ─────────────────────────────────────────────────────

name: ChaosOps CI/CD Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build-and-test:
    name: Build & Test
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 18

      - name: Install Frontend Dependencies
        run: npm ci

      - name: Build Frontend payload
        run: npm run build

      - name: Validate Backend Dependencies
        working-directory: ./backend
        run: npm ci

  docker-publish:
    name: Build and Push Docker Images
    runs-on: ubuntu-latest
    needs: build-and-test
    if: github.event_name == 'push'
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Log in to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      - name: Build and push Frontend
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ secrets.DOCKER_USERNAME }}/chaosops-frontend:latest

      - name: Build and push Backend
        uses: docker/build-push-action@v5
        with:
          context: ./backend
          push: true
          tags: ${{ secrets.DOCKER_USERNAME }}/chaosops-backend:latest
```

---

### 5. Jenkinsfile
A declarative continuous integration pipeline definition utilized by executing Jenkins agents to bridge Source Control (Git), Containerization (Docker), and Infrastructure Configuration (Ansible/Terraform).

#### **Jenkinsfile**
```groovy
// ─────────────────────────────────────────────────────────
// Jenkinsfile — CI/CD Pipeline for ChaosOps App
// Pipeline stages:
//  1. Checkout      - Pull source code from GitHub
//  2. Build         - Generate JS bundles
//  3. Docker Build  - Package containers independently
//  4. Deploy        - Invoke the Ansible Orchestrator 
// ─────────────────────────────────────────────────────────

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
        
        stage('Build Phase') {
            steps {
                echo 'Building ChaosOps React Frontend...'
                sh 'npm install && npm run build'
                
                echo 'Installing Node.js Backend Context...'
                dir('backend') {
                    sh 'npm install'
                }
            }
        }
        
        stage('Docker Publishing') {
            steps {
                echo 'Authenticating with Docker Hub...'
                sh 'echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin'
                
                echo 'Packaging and Delivering Frontend Container...'
                sh "docker build -t ${FRONTEND_IMAGE} ."
                sh "docker push ${FRONTEND_IMAGE}"
                
                echo 'Packaging and Delivering API Server...'
                dir('backend') {
                    sh "docker build -t ${BACKEND_IMAGE} ."
                    sh "docker push ${BACKEND_IMAGE}"
                }
            }
        }

        stage('Ansible Orchestration Deployment') {
            steps {
                echo 'Handing off to Configuration Management...'
                dir('ansible') {
                    // This directly triggers the Terraform stack we engineered
                    sh 'ansible-playbook deploy-infrastructure.yml'
                }
            }
        }
    }
    
    post {
        success {
            echo "✅ Jenkins Pipeline SUCCESS — ChaosOps Build #${BUILD_NUMBER} Deployed natively via Ansible/Terraform."
        }
        failure {
            echo "❌ Pipeline FAILED — Refer to build logs."
        }
    }
}
```
