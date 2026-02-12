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
                sh 'npm install'
            }
        }

        stage('Build & Test') {
            steps {
                script {
                    sh "docker build -t ${IMAGE_NAME}:${env.BUILD_NUMBER} ."                    
                    sh "docker run -d --name test_container ${IMAGE_NAME}:${env.BUILD_NUMBER}"
                    sh "sleep 5"
                    sh "docker exec test_container curl -s http://localhost:3000 || (docker stop test_container && docker rm test_container && exit 1)"
                    sh "docker stop test_container && docker rm test_container"
                }
            }
        }

        stage('Manual Approval') {
            steps {
                input message: "Build #${env.BUILD_NUMBER} is tested. Push to Registry and Deploy?", ok: "Approve"
            }
        }

        stage('Login & Push') {
            steps {
                sh "echo \$DOCKERHUB_CREDENTIALS_PSW | docker login -u \$DOCKERHUB_CREDENTIALS_USR --password-stdin"
                sh "docker tag ${IMAGE_NAME}:${env.BUILD_NUMBER} ${IMAGE_NAME}:latest"
                sh "docker push ${IMAGE_NAME}:${env.BUILD_NUMBER}"
                sh "docker push ${IMAGE_NAME}:latest"
            }
        }

        stage('Post-Production Deploy') {
            steps {
                script {
                    sh "docker stop my-live-app || true"
                    sh "docker rm my-live-app || true"
                    sh "docker run -d --network devops-net -p 3000:3000 --name my-live-app ${IMAGE_NAME}:latest"
                }
            }
        }
    }

    post {
        always {
            sh "sudo chmod 666 /var/run/docker.sock || true"
            sh "docker image prune -f"
        }
        success {
            echo "Deployment of Build #${env.BUILD_NUMBER} was successful!"
        }
        failure {
            echo "Pipeline failed. Check the logs for errors."
        }
    }
}
