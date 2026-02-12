pipeline {
    agent any

    environment {
        DOCKER_USER = 'iron5pi3dr11' 
        IMAGE_NAME = "${DOCKER_USER}/devops-app"
        DOCKERHUB_CREDENTIALS = credentials('dockerhub-creds')
    }

    stages {
        stage('Pull Code') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            agent {
                docker { 
                    image 'node:18-alpine' 
                    reuseNode true 
                }
            }
            steps {
                sh 'npm ci'
            }
        }

        stage('Build & Test Image') {
            // We use the Docker-in-Docker sidecar approach here
            agent {
                docker {
                    image 'docker:latest'
                    args "-u root -v /var/run/docker.sock:/var/run/docker.sock"
                    reuseNode true
                }
            }
            steps {
                sh "docker build -t ${IMAGE_NAME}:${env.BUILD_NUMBER} ."
            }
        }

        stage('Push to Docker Hub') {
            agent {
                docker {
                    image 'docker:latest'
                    args "-u root -v /var/run/docker.sock:/var/run/docker.sock"
                    reuseNode true
                }
            }
            steps {
                sh "echo \$DOCKERHUB_CREDENTIALS_PSW | docker login -u \$DOCKERHUB_CREDENTIALS_USR --password-stdin"
                sh "docker push ${IMAGE_NAME}:${env.BUILD_NUMBER}"
                sh "docker tag ${IMAGE_NAME}:${env.BUILD_NUMBER} ${IMAGE_NAME}:latest"
                sh "docker push ${IMAGE_NAME}:latest"
            }
        }

        stage('Deploy') {
            // Back to the host agent to swap the live container
            steps {
                sh "docker stop my-live-app || true && docker rm my-live-app || true"
                sh "docker run -d --network devops-net -p 80:3000 --name my-live-app ${IMAGE_NAME}:latest"
            }
        }
    }
}
