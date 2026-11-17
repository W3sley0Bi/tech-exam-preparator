
## Describe Factors That Can Affect Costs in Azure

#module1 

**6 factors that affect cost:**

| Factor                | Key point                                                |
| --------------------- | -------------------------------------------------------- |
| **Resource type**     | Type, settings, and region all affect price              |
| **Consumption**       | Pay-as-you-go — use more, pay more                       |
| **Maintenance**       | Unused/forgotten resources still cost money              |
| **Geography**         | Prices vary by region; outbound data transfer costs more |
| **Subscription type** | Free trial includes credits and free products            |
| **Azure Marketplace** | Third-party solutions — you pay Azure + vendor fees      |

**4 pricing/consumption models:**

|Model|Best for|
|---|---|
|**Pay-as-you-go**|Flexible, unpredictable workloads|
|**Reservations**|Stable, predictable workloads (1 or 3 year commit)|
|**Savings plan for compute**|Steady usage but need flexibility across compute types|
|**Spot VMs**|Interruptible/fault-tolerant workloads — cheapest option, but can be evicted|

> ⚠️ **Billing zones** ≠ **Availability zones** — billing zones are geographic groupings used only for data transfer pricing. Inbound data to Azure is generally free; outbound costs money.


## Explore the Pricing Calculator

- **Pricing calculator** — estimates cost of provisioning Azure resources before you deploy
- Covers compute, storage, networking, redundancy options
- For **information only** — nothing is provisioned, nothing is charged
- > ⚠️ The **TCO (Total Cost of Ownership) calculator has been retired**
    

## Describe the Microsoft Cost Management Tool

**3 pillars of Cost Management:**

|Pillar|What it does|
|---|---|
|**Cost analysis**|Visual breakdown of costs by region, resource, billing cycle etc.|
|**Cost alerts**|Notifies you when spending thresholds are hit|
|**Budgets**|Set spending limits, trigger alerts or automate resource shutdown|

**3 types of cost alerts:**

|Alert type|Who it's for|
|---|---|
|**Budget alerts**|Everyone — fires when spend reaches a defined threshold|
|**Credit alerts**|EA (Enterprise Agreement) customers — fires at 90% and 100% of credit|
|**Department spending quota alerts**|EA customers — fires at defined % of department quota|

## Describe the Purpose of Tags

Tags = **name/value pairs** attached to resources for organisation and tracking.

**6 use cases:**

|Use case|Example|
|---|---|
|**Resource management**|Find all resources belonging to a team|
|**Cost management**|Group resources by cost centre for billing|
|**Operations management**|Identify mission-critical resources for SLAs|
|**Security**|Classify data as public or confidential|
|**Governance & compliance**|Flag resources that meet ISO 27001 etc.|
|**Workload automation**|Tag resources for Azure DevOps automation|

**Example tag set (good starter kit):**

|Name|Example value|
|---|---|
|AppName|MyWebApp|
|CostCenter|Finance-42|
|Owner|Wesley|
|Environment|Prod / Dev / Test|
|Impact|Mission-critical|

> ⚠️ Tags are **NOT inherited** from subscriptions or resource groups — each level is independent. You can enforce tagging rules using **Azure Policy**.


## Describe Cost Optimization Options in Azure

**Quick decision guide:**

| Workload type                                   | Best option            |
| ----------------------------------------------- | ---------------------- |
| Predictable, long-running, stable               | **Reservations**       |
| Steady but flexible across compute              | **Azure Savings Plan** |
| Interruptible, batch jobs, lowest cost priority | **Spot VMs**           |

> 💡 Review your pricing model regularly — a workload that starts as interruptible may become business-critical over time.


## ⚠️ Exam Tips — Common Confusions

- **Billing zones ≠ Availability zones** — completely different concepts
- **Spot VMs** can be **evicted at any time** — never use for critical workloads
- **Tags are not inherited** — you must apply them at each level manually (or enforce via Azure Policy)
- **TCO calculator has been retired** — only the Pricing calculator exists now
- **Credit alerts** are only for **EA (Enterprise Agreement)** customers
- **Cost Management** monitors and alerts — it does NOT prevent overspending unless you configure budget automation

---

## Describe the Purpose of Microsoft Purview

#module2 

**Microsoft Purview** = unified data governance, risk, and compliance platform covering on-premises, multicloud, and SaaS data.

**3 core capabilities:**

- **Automated data discovery**
- **Sensitive data classification**
- **End-to-end data lineage**

**2 main solution areas:**

|Area|What it does|
|---|---|
|**Risk & Compliance**|Protect sensitive data, identify risks, manage regulatory compliance — uses M365 (Teams, OneDrive, Exchange)|
|**Unified Data Governance**|Map and manage your entire data estate across Azure, SQL, Hive, AWS S3, and more|


## Describe the Purpose of Azure Policy

**Azure Policy** = service to create, assign, and manage policies that enforce compliance rules across your resources.

**Key behaviours:**

- Evaluates resources and flags non-compliant ones
- Can **prevent** non-compliant resources from being created
- Can **automatically remediate** non-compliant resources (e.g. add a missing tag)
- Policies are **inherited** — set at a high level, applies to everything below
- Integrates with **Azure DevOps** for CI/CD pipeline compliance

**Policies vs Initiatives:**

|Concept|What it is|
|---|---|
|**Policy**|A single rule (e.g. only allow certain VM sizes)|
|**Initiative**|A **group** of related policies working toward one compliance goal|

> 💡 Example initiative: _"Enable Monitoring in Azure Security Center"_ — contains 100+ individual policy definitions


## Describe the Purpose of Resource Locks

**Resource locks** prevent accidental deletion or modification — even for users with RBAC permissions.

**2 types of locks:**

|Lock type|What it allows|What it blocks|
|---|---|---|
|**Delete**|Read + modify|Delete|
|**ReadOnly**|Read only|Delete + update|

**Key rules:**

- Locks are **inherited** — a lock on a resource group applies to all resources inside it
- To modify a locked resource: **remove the lock first**, then make changes, then re-lock
- Locks apply **regardless of RBAC** — even an Owner must remove the lock first


## Describe the Purpose of the Service Trust Portal

**Service Trust Portal** = Microsoft's public portal for security, privacy, and compliance documentation.

URL: **https://servicetrust.microsoft.com/**

**Key sections:**

- **My Library** — save/pin documents, set update notifications
- **All Documents** — single place to find all compliance reports and docs

> ⚠️ Some content requires sign-in with a Microsoft Entra work/school account + acceptance of a non-disclosure agreement (NDA) ⚠️ Documents are available for download for **at least 12 months** after publishing


## ⚠️ Exam Tips — Common Confusions

- **Azure Policy** enforces rules; **RBAC** controls access — they work together but are different
- **Resource locks override RBAC** — even an Owner can't delete a locked resource without removing the lock first
- **ReadOnly lock** is stricter than **Delete lock**
- **Azure Policy initiatives** = groups of policies, not a single rule
- **Microsoft Purview** covers governance AND compliance — don't confuse it with just a compliance tool
- **Service Trust Portal** is for reading Microsoft's compliance docs — not for managing your own resources

--- 
# Describe features and tools for managing and deploying Azure resources

#module3 

## Describe Tools for Interacting with Azure

**5 main tools for managing Azure:**

| Tool                  | What it is                                                                |
| --------------------- | ------------------------------------------------------------------------- |
| **Azure Portal**      | Web-based GUI — build, manage, monitor resources visually                 |
| **Azure Cloud Shell** | Browser-based shell — no install needed, supports both PowerShell and CLI |
| **Azure PowerShell**  | Shell using **cmdlets** — calls Azure REST API, runs on Windows/Linux/Mac |
| **Azure CLI**         | Functionally same as PowerShell but uses **Bash** syntax                  |
| **Copilot in Azure**  | AI assistant for operational guidance — still requires human validation   |

**Key distinctions:**

- **Azure Portal** = GUI, no code needed
- **Cloud Shell** = browser-based, already authenticated, supports both PowerShell and CLI
- **PowerShell vs CLI** = same capabilities, different syntax (PowerShell = cmdlets, CLI = Bash)
- Choose PowerShell or CLI based on **which language you're more comfortable with**

## Describe the Purpose of Azure Arc

**Azure Arc** = extends Azure management to **hybrid and multicloud** environments — manage everything from one place.

**What it lets you manage outside of Azure:**

- Servers
- Kubernetes clusters
- Azure data services
- SQL Server
- Virtual machines (preview)

**Key idea:** Project non-Azure resources into **Azure Resource Manager** so you can apply Azure governance, policy, and monitoring to them — even if they live on-premises or in AWS/GCP.


## Describe Azure Resource Manager and Azure ARM Templates

**Azure Resource Manager (ARM)** = the deployment and management layer behind everything in Azure. Every action (portal, CLI, PowerShell, API) goes through ARM.

**What ARM lets you do:**

- Deploy, manage, and monitor resources as a group
- Define dependencies so resources deploy in the right order
- Apply RBAC natively across all services
- Apply tags for organisation and cost reporting
- Use declarative templates instead of manual scripts

### ARM Templates

JSON files that define **what** you want to deploy (declarative — not step-by-step instructions).

**Benefits:**

| Benefit                | What it means                                                      |
| ---------------------- | ------------------------------------------------------------------ |
| **Declarative syntax** | Define the end state, ARM figures out how to get there             |
| **Repeatable results** | Same template = same outcome every time                            |
| **Orchestration**      | ARM handles dependency order and parallel deployment automatically |
| **Modularity**         | Split into reusable components and nested templates                |
| **Extensibility**      | Add PowerShell/Bash scripts for extra setup steps                  |

### Bicep

**Bicep** = a simpler, more readable alternative to JSON ARM templates — still deploys via ARM.

|ARM Templates (JSON)|Bicep|
|---|---|---|
|Syntax|Verbose JSON|Cleaner, more concise|
|Outcome|Same|Same|
|Idempotent|Yes|Yes|
|Orchestration|ARM handles it|ARM handles it


---

#module4 

## Describe the Purpose of Azure Advisor

**Azure Advisor** = personalised best-practices recommendation engine built into the Azure portal.

**5 recommendation categories:**

|Category|What it addresses|
|---|---|
|**Reliability**|Flags configuration risks that could affect uptime|
|**Security**|Detects threats and vulnerabilities|
|**Performance**|Suggests changes to speed up applications|
|**Operational Excellence**|Workflow and deployment improvements|
|**Cost**|Finds ways to reduce Azure spending|

- Recommendations can be acted on, postponed, or dismissed
- You can filter by subscription, resource group, or service
- You can set up **notifications** for new recommendations

## Describe Azure Service Health

**Azure Service Health** = keeps you informed about the health of Azure and your specific resources.

**3 views — from broad to narrow:**

| View                | Scope                              | What it shows                                                                           |
| ------------------- | ---------------------------------- | --------------------------------------------------------------------------------------- |
| **Azure Status**    | Global — all services, all regions | Widespread outages affecting Azure globally                                             |
| **Service Health**  | Your services and regions only     | Outages, planned maintenance, health advisories relevant to you                         |
| **Resource Health** | Individual resources (e.g. one VM) | Whether a specific resource is healthy, and whether the issue is Azure's fault or yours |

- Set up **alerts** in Service Health to be notified automatically
- **Historical alerts** are retained so you can spot recurring trends
- Provides links to support when an event affects your workloads

## Describe Azure Monitor

**Azure Monitor** = platform for collecting, analysing, and acting on data from Azure, on-premises, and multicloud environments.

Collects **logs and metrics** from applications, operating systems, and network layers — stores centrally, surfaces through dashboards, queries, and alerts.

**3 key components:**

### Azure Log Analytics

- Tool in the Azure portal for writing and running **queries** against Monitor data
- Supports simple filtering (e.g. all errors in the last hour) to advanced trend analysis

### Azure Monitor Alerts

- Notifies you when a condition you defined is met
- **Two types:**
    - **Metric alerts** — e.g. email when CPU stays above 80%
    - **Log alerts** — watch for specific error patterns across resources
- Uses **action groups** (reusable across Monitor, Service Health, and Advisor) to define who gets notified and what happens

### Application Insights

- Azure Monitor feature for monitoring **web application** performance and usage
- Works in Azure, on-premises, or other clouds
- Set up via SDK or agentless (no code changes needed)

**What it monitors:**

- Request rates, response times, failure rates
    
- Dependency call performance
    
- Page load times, user counts, session trends
    
- Server CPU, memory, network usage
    
- Supports **availability tests** — synthetic requests to confirm your app is responding even during low traffic
    

---

## ⚠️ Exam Tips — Common Confusions

- **Azure Advisor** = recommendations to _improve_ your setup — not for monitoring live health
- **Azure Monitor** = _collects and analyses_ data — the platform everything else sits on
- **Service Health** = Azure's own health, not your app's health
- **Resource Health** = your specific resource's health
- **Application Insights** is a _feature of Azure Monitor_ — not a separate service
- **Action groups** are reusable across Monitor, Service Health, AND Advisor — one group, many uses
- **Log Analytics** is where you _query_ the data Monitor collects — not where it's collected