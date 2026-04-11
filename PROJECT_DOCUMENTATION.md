# Project Documentation: ChaosOps

## 1. ABSTRACT

The rapid evolution of software engineering has led to the widespread adoption of cloud-native architectures and microservices. While this paradigm shift offers unprecedented scalability, agility, and decoupled deployment lifecycles, it simultaneously introduces immense complexity. Distributed systems operate across unreliable networks where unpredictable variables—such as hardware degradation, network partitions, cascading software failures, and resource starvation—are inevitable. Traditional software testing methodologies (such as unit, integration, and end-to-end testing) are fundamentally inadequate because they typically simulate clean, sterilized environments that fail to mirror the chaotic nature of real-world production networks. To combat this, the discipline of Chaos Engineering has emerged. It advocates for the proactive and deliberate injection of failures into a system to uncover systemic weaknesses before they manifest as catastrophic outages.

This project introduces **ChaosOps**, a comprehensive, enterprise-grade Web Application designed to merge the principles of Chaos Engineering with advanced Observability and system monitoring. ChaosOps serves as a centralized control plane for DevOps, Site Reliability Engineers (SREs), and developers to orchestrate fault-injection experiments dynamically on Kubernetes clusters. Beyond simply breaking systems, ChaosOps aims to measure the *impact* of those breaks. 

By integrating an interactive React.js front-end with a robust Node.js backend and a MongoDB database, the platform allows users to visually define cluster typologies, register microservices, and design intricate "GameDay" scenarios. Users can inject specific faults—ranging from pod termination and network latency to CPU stress and disk saturation—while observing real-time telemetry such as pod availability, average latency, and resource utilization. The overarching goal of the ChaosOps project is to demystify chaos engineering, replacing fragmented terminal scripts with a highly visual, automated, and unified platform. Ultimately, this tool empowers engineering teams to build profound confidence in their distributed systems, significantly minimizing unanticipated downtime and driving down the Mean Time to Recovery (MTTR) across modern infrastructure topologies.

<br><br><br><br>

## 2. PROBLEM STATEMENT

In the contemporary landscape of enterprise software, distributed microservice architectures deployed on container orchestration platforms like Kubernetes have become the industry standard. However, the operational reality of these systems is characterized by extreme fragility. 

**The Fragility of Distributed Environments:** A single user request may traverse dozens of loosely coupled services, APIs, and databases. If a single node experiences a transient network drop, or if a minor configuration error causes a specific microservice pod to crash-loop, the resulting bottleneck can cause a cascading wave of failures. Without proactive safeguards, these cascading failures routinely result in severe service degradations, leading to financial loss, damaged user trust, and violations of Service Level Agreements (SLAs).

**Limitations of Conventional Testing:** Currently, organizations rely heavily on CI/CD pipelines equipped with unit tests, functional tests, and load testing. However, these mechanisms primarily test "known unknowns" in heavily mocked environments. They verify business logic but fundamentally fail to answer infrastructural questions: *What happens if our primary database cluster unexpectedly reboots? How does the checkout microservice behave if the payment API is experiencing 500ms of latency? Does our auto-scaling group trigger appropriately when CPU load hits 100%?* Engineers only discover the answers to these questions when incidents occur in real-world production environments at 3:00 AM.

**Fragmented Tooling and High Cognitive Load:** Even when organizations attempt to adopt Chaos Engineering, the tooling is often highly fragmented. An SRE might use terminal-level scripts or individual Kubernetes tools (like Chaos Mesh or Litmus) to inject faults. Concurrently, they must monitor another interface (like Datadog or Grafana) to observe the impact, and a third interface to track system alerts. This lack of integration requires engineers to constantly context-switch, making it exceedingly difficult to correlate a specific injected fault with an observed spike in latency or a dropped pod.

**The Need for ChaosOps:** Therefore, the core problem is the lack of a unified, automated, and visually intuitive platform that seamlessly integrates *fault injection* with *impact observation*. Organizations need a system that removes the steep learning curve of chaos engineering, providing a centralized dashboard where they can deliberately design failure, safely trigger it, and automatically correlate the architectural fallout without relying on ad-hoc scripts.

<br><br><br><br>

## 3. OBJECTIVE

The primary aim of this project is to architect, develop, and deploy **ChaosOps**, a holistic platform that acts as the nexus between deliberate system failure and real-time observability. The application is designed to operationalize Site Reliability Engineering (SRE) practices by making chaos engineering accessible, measurable, and highly automated.

The overarching objective is achieved through the following specific sub-objectives:

1. **Development of a Unified Visual Interface (Frontend):** To design an intuitive, "deep space navy" themed Web Graphical User Interface (GUI) using React.js and Vite. This interface must abstract the complexities of raw Kubernetes commands, enabling users to register microservices, view topological dependency graphs, and orchestrate complex fault injections through a seamless, modern User Experience (UX).

2. **Creation of a Centralized State and Command Backend:** To construct a highly performant API gateway utilizing Node.js and Express. This backend objective involves designing a RESTful API capable of dynamically tracking distributed entity health, managing experiment lifecycles, and acting as the intermediary translating user commands into Kubernetes cluster executions.

3. **Persistent Data and Post-Mortem Analytics:** To engineer a schema-driven database solution utilizing MongoDB (NoSQL). The objective is to persistently record intricate logs containing historic chaos experiment data, infrastructure states, system alerts, and predefined experiment templates. This enables organizations to conduct long-term trend analysis and track the improvement of their overall "Resilience Score" over time.

4. **Integration of Observability and Real-Time Telemetry:** To build sub-modules capable of polling and interpreting critical health metrics (CPU utilization, memory usage, replica set availability, and average response latency) in real time. The system must synthesize this data to immediately reflect the impact of a chaos event—transitioning services from "Healthy" to "Degraded"—and alert the user accordingly.

5. **Automation of 'GameDay' Scenarios:** To implement a robust scheduling engine that allows SRE teams to automate fault procedures. By allowing the scheduling of templated experiments, the platform aims to shift the organizational culture from reactive firefighting to continuous, automated validation of system resilience.

<br><br><br><br>

## 4. METHODOLOGY / ARCHITECTURE

The development of the ChaosOps platform follows an Agile software engineering methodology, ensuring iterative enhancements, modular component design, and continuous integration. The technical architecture is structured around a decoupled, three-tier cloud-native stack comprising the Frontend Presentation Layer, Backend Application Layer, and Data Persistence/Infrastructure Layer.

### 4.1 Frontend Presentation Layer
The front-end is constructed as a Single Page Application (SPA) utilizing **React 18** paired with the **Vite** build tool for rapid hot-module reloading and optimized bundling. 
- **Styling & UI Framework:** To ensure a highly polished, enterprise-ready interface, the project strictly employs **Tailwind CSS** combined with **Radix UI** primitives and **Lucide React** iconography. This enables visually consistent, responsive layouts like the dynamic Sidebar, Top Navigation, and intricate Metric Cards.
- **Data Visualization:** The architecture relies on **Recharts** to transform raw telemetry data into interactive, real-time Area and Bar charts. Further, custom-rendered DOM graphs are utilized for the `ServiceDependencyGraph` to plot topological mappings of interconnected microservices.
- **State Management & Routing:** **React Router** is utilized for view composition (e.g., separating the Dashboard, Experiment Library, and Services views). Asynchronous API interactions fetch data from the backend to dynamically populate React state.

### 4.2 Backend Application Layer
The backend logic is driven by a heavily asynchronous **Node.js** environment executing an **Express.js** API Server.
- **API Construction:** The server exposes a suite of RESTful endpoints (`/api/:entity`) that handle CRUD operations dynamically based on the requested entity (Microservice, ChaosExperiment, SystemAlert, etc.). 
- **Business Logic Integration:** This layer is responsible for authenticating requests, validating data payloads against Mongoose schemas, and processing requests to trigger or abort operations targeting the underlying infrastructure.

### 4.3 Data Persistence Layer
The application utilizes **MongoDB**, a NoSQL document database, suited perfectly for the hierarchical, fast-evolving metadata of microservices and telemetry logs. 
- **Mongoose Data Modeling:** Strict Entity-Relationship schemas are enforced at the application level using Mongoose. Crucial models include `Microservice` (tracking `replicas_desired`, `cpu_usage`, `language`), `ChaosExperiment` (tracking `chaos_type`, `intensity`, `duration`), and `ExperimentTemplate`.

### 4.4 Infrastructure & Deployment Architecture
The entire application footprint is containerized and orchestrated via **Kubernetes (Minikube / Docker Desktop)**.
- **Containerization:** Separate Multi-stage `Dockerfiles` package the Node APIs securely and serve the static React dist over lightweight `Nginx:alpine` instances.
- **Kubernetes Orchestration:** The platform is deployed directly into a cluster utilizing `Deployments` to manage pod lifecycles ensuring high availability. Access is routed using Kubernetes `Services` configured as `NodePorts`, effectively bridging the local machine to the internal cluster network while the Node backend communicates with local un-containerized processes (like MongoDB).

<br><br><br><br>

## 5. WORKFLOW EXPLANATION

The ChaosOps platform operationalizes chaos engineering through a structured, multi-phased workflow that ensures experiments are executed safely, monitored accurately, and analyzed effectively. The user interacts with the system through distinct operational phases:

### Phase 1: Registration and Discovery
The workflow begins with configuring the topological map of the target environment.
- The user navigates to the **Services** module and registers their operational microservices. They define critical metadata: the service name, backend language (e.g., nodejs, go), expected replica count, and baseline thresholds for latency and uptime.
- The backend stores this state in the MongoDB. On the frontend's main **Overview Dashboard**, these services immediately appear, enabling real-time telemetry rendering on the Area Charts and Status Badges.

### Phase 2: Hypothesis and Experiment Definition
Chaos engineering starts with a hypothesis (e.g., "If I kill one pod of the payment service, the load balancer will catch it without causing 500 errors to the client").
- The engineer accesses the **Experiment Library** to select a predefined template, or navigates to **Experiments** to create a custom scenario.
- They configure the parameters of the chaos injection: selecting a `target_service`, defining the `chaos_type` (such as `pod_kill`, `network_latency`, or `cpu_stress`), setting the `intensity`, and specifying the `duration`. The system records this into the database in a `Pending` state.

### Phase 3: Execution and Active Telemetry
Once the user initiates the experiment, the workflow enters its most critical phase.
- The backend transitions the experiment to `Running` and records the exact start timestamp (`started_at`).
- Theoretically connecting through the Kubernetes RBAC API, the system forces the execution of the fault (e.g., terminating `replica-1` of the targeted microservice).
- Simultaneously, the ChaosOps observability engine intensely polls for state changes. The UI immediately reflects this: the target microservice transitions from a status of `Healthy` to `Degraded`. The real-time charts record a spike in Average Latency and a dip in Active Pods. 
- If the system detects that thresholds are critically violated (e.g., the service crashes entirely), the platform's auto-abort mechanism can immediately cease the fault injection to prevent catastrophic damage.

### Phase 4: Resolution and Post-Mortem Analysis
Once the defined duration is complete, the fault injection ceases.
- The platform continues to actively monitor the microservice until it reaches steady-state baseline performance.
- The system calculates the **Recovery Time Objective** and assigns a "pass" or "fail" mark to the experiment.
- The experiment status transitions to `Completed`. The user can then review historical graphs mapping exactly how long it took Kubernetes to spin up replacement pods and restore full traffic. 
- Finally, all data is aggregated into the **Resilience Score** widget on the dashboard, providing executive stakeholders an easily digestible metric representing the overarching infrastructure's durability against unexpected failures.
