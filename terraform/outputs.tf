output "frontend_url" {
  description = "The NodePort details to access the frontend"
  value       = "http://localhost:${kubernetes_service.frontend.spec[0].port[0].node_port}"
}
