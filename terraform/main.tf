resource "kubernetes_namespace" "chaosops" {
  metadata {
    name = var.namespace
  }
}

# --- MONGODB ---
resource "kubernetes_deployment" "mongo" {
  metadata {
    name      = "chaosops-mongo"
    namespace = kubernetes_namespace.chaosops.metadata[0].name
  }
  spec {
    replicas = 1
    selector {
      match_labels = {
        app = "chaosops-mongo"
      }
    }
    template {
      metadata {
        labels = {
          app = "chaosops-mongo"
        }
      }
      spec {
        container {
          name  = "mongo"
          image = var.mongo_image
          port {
            container_port = 27017
          }
        }
      }
    }
  }
}

resource "kubernetes_service" "mongo" {
  metadata {
    name      = "chaosops-mongo"
    namespace = kubernetes_namespace.chaosops.metadata[0].name
  }
  spec {
    selector = {
      app = "chaosops-mongo"
    }
    port {
      port        = 27017
      target_port = 27017
    }
  }
}

# --- BACKEND ---
resource "kubernetes_deployment" "backend" {
  metadata {
    name      = "chaosops-backend"
    namespace = kubernetes_namespace.chaosops.metadata[0].name
  }
  spec {
    replicas = 1
    selector {
      match_labels = {
        app = "chaosops-backend"
      }
    }
    template {
      metadata {
        labels = {
          app = "chaosops-backend"
        }
      }
      spec {
        container {
          name              = "backend"
          image             = var.backend_image
          image_pull_policy = "Never"
          port {
            container_port = 3001
          }
          env {
            name  = "MONGO_URI"
            value = "mongodb://chaosops-mongo:27017/ChaosOpsStats"
          }
        }
      }
    }
  }
}

resource "kubernetes_service" "backend" {
  metadata {
    name      = "chaosops-backend"
    namespace = kubernetes_namespace.chaosops.metadata[0].name
  }
  spec {
    selector = {
      app = "chaosops-backend"
    }
    port {
      port        = 3001
      target_port = 3001
    }
  }
}

# --- FRONTEND ---
resource "kubernetes_deployment" "frontend" {
  metadata {
    name      = "chaosops-frontend"
    namespace = kubernetes_namespace.chaosops.metadata[0].name
  }
  spec {
    replicas = var.replicas
    selector {
      match_labels = {
        app = "chaosops-frontend"
      }
    }
    template {
      metadata {
        labels = {
          app = "chaosops-frontend"
        }
      }
      spec {
        container {
          name              = "frontend"
          image             = var.frontend_image
          image_pull_policy = "Never"
          port {
            container_port = 80
          }
        }
      }
    }
  }
}

resource "kubernetes_service" "frontend" {
  metadata {
    name      = "chaosops-frontend"
    namespace = kubernetes_namespace.chaosops.metadata[0].name
  }
  spec {
    type = "NodePort"
    selector = {
      app = "chaosops-frontend"
    }
    port {
      port        = 80
      target_port = 80
      node_port   = 30007
    }
  }
}
