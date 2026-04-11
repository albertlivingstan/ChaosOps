variable "namespace" {
  description = "The namespace for ChaosOps deployment"
  type        = string
  default     = "chaosops"
}

variable "frontend_image" {
  description = "The Docker image for the frontend"
  type        = string
  default     = "chaosops-app:latest"
}

variable "backend_image" {
  description = "The Docker image for the backend"
  type        = string
  default     = "chaosops-backend:latest"
}

variable "mongo_image" {
  description = "The MongoDB image"
  type        = string
  default     = "mongo:latest"
}

variable "replicas" {
  description = "Number of replicas for frontend apps"
  type        = number
  default     = 2
}
