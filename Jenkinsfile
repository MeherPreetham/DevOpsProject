pipeline {
    agent any

    environment {
        DOCKER_USER = 'iron5pi3dr11' 
        IMAGE_NAME = "${DOCKER_USER}/devops-app"
        DOCKERHUB_CREDENTIALS = credentials('dockerhub-creds')
    }

    stages {
        stage('Build & Image') {
            agent {
                docker { 
                    image 'node:18-alpine' 
                    reuseNode true 
                }
            }
            steps {
                sh 'npm ci'
                sh 'npm run build'
                script {
                    sh "docker build -t ${IMAGE_NAME}:${env.BUILD_NUMBER} ."
                }
            }
        }

        stage('Docker Image Push') {
            steps {
                script {
                    sh "echo \$DOCKERHUB_CREDENTIALS_PSW | docker login -u \$DOCKERHUB_CREDENTIALS_USR --password-stdin"
                    sh "docker push ${IMAGE_NAME}:${env.BUILD_NUMBER}"
                    sh "docker tag ${IMAGE_NAME}:${env.BUILD_NUMBER} ${IMAGE_NAME}:latest"
                    sh "docker push ${IMAGE_NAME}:latest"
                }
            }
        }

        stage('Staging Test') {
            steps {
                script {
                    // Start a temporary staging container
                    sh "docker run -d --name staging-app -p 3001:3000 ${IMAGE_NAME}:${env.BUILD_NUMBER}"
                    
                    // Run a test and pipe output to a file
                    sh "echo 'Running Staging Tests...' > staging_results.txt"
                    sh "curl -s http://localhost:3001 || echo 'App failed to respond' >> staging_results.txt"
                    sh "docker ps | grep staging-app >> staging_results.txt"
                    
                    // Clean up staging
                    sh "docker stop staging-app && docker rm staging-app"
                }
            }
            post {
                always {
                    archiveArtifacts artefacts: 'staging_results.txt', fingerprint: true, onlyIfSuccessful: false
                }
            }
        }

        stage('Approval') {
            steps {
                input message: "Does the staging test look good? Deploy to Production?", ok: "Deploy"
            }
        }

        stage('Production Deploy') {
            steps {
                sh "docker stop my-live-app || true && docker rm my-live-app || true"
                sh "docker run -d --network devops-net -p 80:3000 --name my-live-app ${IMAGE_NAME}:latest"
            }
        }

        stage('Post-Prod Test') {
            steps {
                script {
                    sh "echo 'Running Post-Production Health Check...' > prod_results.txt"
                    sh "curl -s http://localhost:80 || echo 'Production App Down!' >> prod_results.txt"
                    sh "docker inspect my-live-app --format '{{.State.Status}}' >> prod_results.txt"
                }
            }
            post {
                always {
                    archiveArtifacts artefacts: 'prod_results.txt', fingerprint: true
                }
            }
        }
    }
}
