#module1 

Whats is azure -> ms cloud computing platform
![[Pasted image 20260517164657.png]]

![[Pasted image 20260517165056.png]]


# Azure physical infrastructure

- starts from Data centers around the world
- they are grouped into regions and availability zones 
	- for resiliency and reliability 
	![[Pasted image 20260517165554.png]]
	**Regions** -> 
	- geographical area with 1 or multiple data centers
	- Azure intelligently assigns and controls the resources within each region to ensure workloads are appropriately balanced.

	**Availability Zones*
	- physically separate datacenters within an Azure region
	- 1 or multiple data centers also here. they are phisically separated but connected between each other
	- ![[Pasted image 20260517170834.png]]
	
	to ensure resiliency, one region has at least 3 availability zones. not all regions support availability zones 

	**Categories for Azure services that support availability zones**-> 
	
	![[Pasted image 20260517171109.png]]
	Not all Azure services automatically replicate data or automatically fall back from a failed region to cross-replicate to another enabled region. In these scenarios, recovery and replication must be configured by the customer.

	 **Regions Pair**
	- Regions are paired (i.e. West US  - East US)
	- good for replication of resources across geography
		- reduce interruption 
	- regions are bidirectional paired (except: Brazil south)
		- Brazil south is the only paired with a region outsited its geography (south central US
		- some regions (such as Italy North, Poland Central, and Israel Central) don't have a traditional region pair and instead rely on availability zones and geo-redundant storage for resiliency.)
	![[Pasted image 20260517171439.png]]

**Sovereign regions** -> 
- instances of Azure that are isolated from the main instance of Azure
- for compliance or legal purposes
	- US DoD Central, US Gov Virginia, US Gov Arizona, and more: These regions are physical and logical network-isolated instances of Azure for U.S. government agencies and partners. These datacenters are operated by screened U.S. personnel and include additional compliance certifications.
	- China East, China North, and more: These regions are available through a unique partnership between Microsoft and 21Vianet, whereby Microsoft doesn't directly maintain the datacenters

# Azure management infrastructure

composed by: 
- azure resource
- resource group
- subscriptions
- accoutns

### Resources and resource groups
anything you created, provision and deploy is a resource (i.e. VMs, virtual networks, db, azure AI)
![[Pasted image 20260517172844.png]]


### Subscriptions
subscriptions are a unit of management, billing, and scale. they let you organize resource groups and control billing separately from access.
![[Pasted image 20260517173118.png]]

you can created different subscription to separate: 
- env
- team and workload boundaries
- Billing

### Azure management groups 
 
Resources inside >  Resource group  inside > subscription 

azure management groups seats above subscriptions. You organize subscriptions into management groups and apply governance conditions — like access policies or compliance rules — to the group. All subscriptions in a management group automatically inherit those conditions, just as resources inherit settings from their resource group. Management groups can be nested up to six levels deep (not counting the root level or the subscription level), letting you build a hierarchy that mirrors your organization.

![[Pasted image 20260517173846.png]]

how to use management groups? 
- Apply a policy across subscriptions
- Grant access to multiple subscriptions at once 

***

#module2 

# Azure virtual machines

run virtualized servers
- total control over the operating system 
- the ability to run custom software
- to use custom hosting configurations

you can deploy VMs from prebuilt images

When to use VMs? 
- testing & development
- cloud application hosting
- datacenter extension: host workload in a connected virtual network
- Disaster recovery
- Lift and shift

**VM Resources**:
- size (RAM)
- storage disk
- Networking (virtual network, public IP address)

**Size families**
![[Pasted image 20260518145102.png]]

- you can customize based on your needs:
	- **vCPU count**: affects compute capacity for concurrent and CPU-bound workloads.
	- **RAM**: affects how much working data the VM can keep in memory.
	- **Disk configuration**: affects storage capacity, IOPS, and throughput.
	- **Network throughput**: affects data transfer performance in and out of the VM.
	- **Premium SSD support**: indicates whether the size supports premium managed disks.
	- **Hardware generation**: indicates platform generation and can affect baseline performance.
![[Pasted image 20260518181234.png]]


VMs can be grouped together to provide high availability, scalability, and redundancy. Azure can manage the grouping thanks to: 
- **Scale set**: 
	- centralize configuration and scale based on demand or schedule
	- integrated with load balancing. 
- **Availability set**: 
	- improve VM resiliency inside a region. they reduce chance of maintenance event or hardware failure 
	- groups are set by:
		- **update domain** -> VMs that cna be rebooted together during planned maintenance
		- **fault domain**-> VMs that share a potential power or network failure point.
	- Availability sets themselves don't add cost; you pay for the VM instances.

# Azure virtual desktop

- It centralizes desktop and app delivery in Azure and integrates with Microsoft Entra ID for identity and access controls.
- It helps reduce data exposure on local devices because apps and data can remain in Azure-hosted sessions.
- It supports single-session and multi-session Windows experiences, depending on user and workload needs.

# Azure Containers

VM virtualize the hardware - Containers virtualize the OS

With **Containers** allows you to have multiple app instances on one host machine. 
each container has its own os. their are lightweight and design to be scale out

Containers help you respond to changes on demand and restart quickly after a crash or hardware interruption

Azure supports Docker

- **Azure Container Instances**
	- is PaaS
	- you upload the container and the service runs them for you
- **Azure Container Apps**
	- is PaaS
	- built-in load balancing and scaling
	- no container management
- **Azure Kubernets Service**
	- container orchestration service that mange containers lifecycle
	
![[Pasted image 20260519193415.png]]

# Azure functions

Azure Functions, an event wakes the function, alleviating the need to keep resources provisioned when there are no events.

![[Pasted image 20260519194000.png]]

Functions scale automatically based on demand, so they may be a good choice when demand is variable.

Functions can be either stateless or stateful. When they're stateless (the default), they behave as if they restart every time they respond to an event. When they're stateful (called Durable Functions), the runtime passes a context through the function to track prior activity.

# AI, Machine learning, and IOT/Edge services in Azure

**Azure AI services**
- prebuilt capabilities for common AI scenarios
	- language 
	- speech
	- vision
	- document processing
- use api instead of having to train your own model
- Azure OpenAI Service is another AI option in Azure that supports generative AI scenarios

**Agentic AI patterns**
- application pattern built from Azure AI capabilities
- AI model with instructions, context, and tool use to complete multistep goals

**Azure Machine Learning**
- when you need to build, train, and manage custom machine learning models.

**IoT and Edge Services**
Azure IoT services help you connect, monitor, and manage devices.
![[Pasted image 20260519200150.png]]

- Use Azure AI services when you need prebuilt AI features exposed through APIs.
- Use Azure Machine Learning when you need custom model development and management.
- Use Azure IoT services when your solution centers on connected devices and telemetry.

# Application hosting options
![[Pasted image 20260519200638.png]]

## Azure App Service

- build and host :
	- Web apps
	- API apps
	- WebJobs
		- this are cool because they run in the same context of a web app
	- Mobile apps

- it's HTTP based service 
- Deployment and management are integrated into the platform.
- Endpoints can be secured.
- Sites can be scaled quickly to handle high traffic loads.
- The built-in load balancing and traffic manager provide high availability.


***
# Azure networking services

#module3 


# Azure Virtual Networking

similar to an extension of a on-premises network with resources that link other azure resources. 

features: 
- Isolation and segmentation
- Internet communications
- Communicate between Azure resources
- Communicate with on-premises resources
- Route network traffic
- Filter network traffic
- Connect virtual networks


It supports 
- Public Endpoints
- private endpoints: only accessible via Virtual network

## Isolation and segmentation 

Azure Virtual Networks allows the creation of isolated VN. 
- the ip address is not internet routable
- for name resolution you can have internal or external DNS

## Internet communications
You can enable incoming connections from the internet by assigning a public IP address to an Azure resource, or putting the resource behind a public load balancer.


## Communicate between Azure resources

AZ resource can communicate in 2 ways: 
- Virtual networks can connect not only VMs but other Azure resources, such as the App Service Environment for Power Apps, Azure Kubernetes Service, and Azure virtual machine scale sets.
- Service endpoints can connect to other Azure resource types, such as Azure SQL databases and storage accounts. This approach lets you link multiple Azure resources to virtual networks to improve security and provide optimal routing between resources.

## Communicate with on-premises resources
- Point-to-site virtual private network connections are from a computer outside your environment back into your private network. In this case, the client computer initiates an encrypted VPN connection to connect to the Azure virtual network.
- Site-to-site virtual private networks link your on-premises VPN device or gateway to the Azure VPN gateway in a virtual network. In effect, the devices in Azure can appear as being on the local network. The connection is encrypted and works over the internet.
- Azure ExpressRoute provides a dedicated private connectivity to Azure that doesn't travel over the internet. ExpressRoute is useful for environments where you need greater bandwidth and even higher levels of security.

## Route network traffic
- Route tables let you define rules about how traffic should be directed. You can create custom route tables that control how packets are routed between subnets.
- Border Gateway Protocol (BGP) works with Azure VPN gateways, Azure Route Server, or Azure ExpressRoute to propagate on-premises BGP routes to Azure virtual networks.
- User-defined routes (UDR) let you control the routing tables between subnets within a virtual network or between virtual networks, giving you greater control over network traffic flow.
## Filter network traffic
- Network security groups
- Network virtual appliance
![[Pasted image 20260519225259.png]]

## Connect virtual networks
done via **virtual network peering** -> allows two virtual networks to connect directly to each other
![[Pasted image 20260519225633.png]]


# Azure Virtual Private Network
- deployed to connect two or more private networks over an untrusted network (tipically the internet)
- traffic is encrypted

## VPN Gateways
- 3 levels of connectivity models 
![[Pasted image 20260522171219.png]]

- type of VPN
	- **Policy-based** ->  specify statically the IP address of packets that should be encrypted through each tunnel.
	- **route-base** -> IPSec tunnels are modeled as a network interface or virtual tunnel interface. IP routing which tunnel interface to use. (best fo on premises devices) good for: 
		- Connections between virtual networks
		- Point-to-site connections
		- Multisite connections
		- Coexistence with an Azure ExpressRoute gateway

## High-availability scenarios

![[Pasted image 20260522172052.png]] ![[Pasted image 20260522172116.png]]
![[Pasted image 20260522172413.png]]



# Azure ExpressRoute


**What it is:** A private connection between your on-premises network and Microsoft cloud (Azure, M365) via a connectivity provider — bypassing the public internet.

**Key benefits to remember:**

- **Private & secure** — traffic doesn't cross the public internet
- **Better performance** — faster speeds, consistent latency, more reliable than standard internet
- **Global reach** — connect on-prem sites to each other _through_ Microsoft's backbone (e.g. Asia office ↔ Europe datacenter)
- **Dynamic routing** via BGP
- **Built-in redundancy** at every peering location

**When to choose ExpressRoute:**

- Need private, consistent on-prem ↔ Azure connectivity
- Strict compliance or data transfer requirements
- Predictable latency / high throughput needed
- Critical traffic that shouldn't go over public internet


**One gotcha for the exam:** Even with ExpressRoute, DNS queries, CRL checks, and Azure CDN requests **still go over the public internet**.

# Describe Azure DNS

**What it is:** A hosting service for DNS domains inside Azure — manages name resolution using Microsoft's infrastructure, same portal/credentials/billing as everything else.

**Key benefits to remember:**

- **Reliability & performance** — hosted on Azure's global network, uses **anycast networking** (closest server answers each query)
- **Security** — built on Azure Resource Manager, so you get RBAC, activity logs, and resource locks
- **Ease of use** — same portal, credentials, billing as other Azure services; supports portal, PowerShell, CLI, REST API
- **Private domains** — use custom domain names inside private virtual networks instead of Azure-generated names
- **Alias records** — point to Azure resources (public IP, Traffic Manager, CDN); auto-updates if the underlying IP changes


**One gotcha for the exam:** Azure DNS **cannot buy domain names** for you. You buy them separately (App Service domains or third-party registrar), then _host_ them in Azure DNS for record management.


--- 

# Azure Storage Services

#module4

## Azure storage accounts

**What it is:** A unique namespace for storing data in Azure, accessible globally over HTTP/HTTPS. Secure, highly available, durable, scalable.

**4 account types to know:**

|Type|Use case|
|---|---|
|**Standard general-purpose v2**|Default for most scenarios — blobs, files, queues, tables|
|**Premium block blobs**|High transaction rates, small objects, low latency|
|**Premium file shares**|High-performance file shares, supports SMB + NFS|
|**Premium page blobs**|Page blobs only (e.g. VM disks)|

**Redundancy options**:
- Locally redundant storage (LRS)
- Geo-redundant storage (GRS)
- Read-access geo-redundant storage (RA-GRS)
- Zone-redundant storage (ZRS)
- Geo-zone-redundant storage (GZRS)
- Read-access geo-zone-redundant storage (RA-GZRS)

**Storage account naming rules:**

- 3–24 characters, lowercase letters and numbers only
- Must be **globally unique** across all of Azure


**Endpoint format to remember:** `https://<account-name>.<service>.core.windows.net`

|Service|Subdomain|
|---|---|
|Blob|`.blob`|
|Data Lake Gen2|`.dfs`|
|Files|`.file`|
|Queue|`.queue`|
|Table|`.table`|

The `.dfs` endpoint for Data Lake is the one most likely to catch you off guard on the exam.

# Azure storage redundancy

**Core idea:** Azure always keeps **3 copies** of your data. The options differ in _where_ those copies live.

**Primary region only:**

| Option  | How it works                         | Durability |
| ------- | ------------------------------------ | ---------- |
| **LRS** | 3 copies in one datacenter           | 11 nines   |
| **ZRS** | 3 copies across 3 availability zones | 12 nines   |

- Locally Redundant Storage = cheapest, but vulnerable to datacenter-level disaster
- Zone Redundant Storage = recommended for high availability within a region


**Primary + Secondary region:**

Geo redundant storage
Geo Zone Redundant storage

|Option|Primary|Secondary|Durability|
|---|---|---|---|
|**GRS**|LRS|LRS|16 nines|
|**GZRS**|ZRS|LRS|16 nines|

- Secondary region is **not readable by default** unless failover happens
- Add **RA-** prefix (RA-GRS, RA-GZRS) to enable read access before failover


**Key exam concepts:**

- Secondary replication is **asynchronous** → possible data loss on failure
- **RPO** (Recovery Point Objective) = typically **under 15 minutes** but no SLA guaranteed
- **GZRS** = Microsoft's recommendation for maximum resilience
- RA- variants let you read secondary data **before** failover, but it may not be fully up to date

# Azure Storage services

**The 5 core services:**

**1. Azure Blobs (Binary Large OBjects)** Unstructured object storage for text and binary data — images, videos, logs, backups, analytics.

Access tiers (cost vs. speed tradeoff):

|Tier|Best for|Min retention|
|---|---|---|
|**Hot**|Frequently accessed data|None|
|**Cool**|Infrequently accessed|30 days|
|**Cold**|Rarely accessed|90 days|
|**Archive**|Long-term backups, rarely touched|180 days|

- Archive has the **lowest storage cost** but **highest retrieval latency**
- Cool/Cold/Archive have **higher access costs** than Hot
- Archive tier **cannot be set at account level**, only at blob level


**2. Azure Files** Fully managed cloud file shares using **SMB (Server Message Block)** or **NFS (Network File System)** protocols — works like a normal network drive, mountable from Windows, Linux, macOS.

**3. Azure Queues** Messaging store for asynchronous communication between app components. Holds millions of messages up to **64 KB** each. Often paired with Azure Functions.

**4. Azure Disks** Block-level storage for Azure **Virtual Machines (VMs)**. Fully managed by Azure.

**5. Azure Tables** **NoSQL** store for large amounts of structured, non-relational data.

**Quick memory trick:**

> **B**lobs, **F**iles, **Q**ueues, **D**isks, **T**ables → **"Big Fluffy Quiet Dogs Talk"** 🐶

# Azure data migration options

**1. Azure Migrate** Online/real-time migration hub for moving on-premises infrastructure, apps, and data to Azure.

- Single portal to assess, plan, and track migration
- Includes built-in tools for servers, databases, and web apps
- Integrates with third-party **ISV (Independent Software Vendor)** tools

**2. Azure Data Box** A **physical device** Microsoft ships to you for offline bulk data transfer.

- Max capacity: **80 TB**
- Use it when network bandwidth is too slow for online transfer
- Ordered and tracked via Azure portal end-to-end
- After import: disks wiped to **NIST 800-88r1** standards
- Works for both **import** (into Azure) and **export** (out of Azure)

**Common use cases:**

- One-time bulk migration
- Periodic large uploads where internet is too slow
- Exporting data for recovery or compliance


# Azure movement options 
**Three tools for moving individual files (not bulk migration):**

**1. AzCopy** Command-line tool for copying/uploading/downloading blobs and files between storage accounts or even other clouds.

- ⚠️ Sync is **one-directional only** — you set source and destination, it doesn't sync both ways

**2. Azure Storage Explorer** A **graphical (GUI)** desktop app to manage files and blobs — works on Windows, macOS, Linux.

- Uses **AzCopy under the hood**
- Good for people who prefer clicking over typing commands

**3. Azure File Sync** Syncs your on-premises Windows file server with Azure Files — **bi-directional**.

- Supports **SMB, NFS, and FTPS (File Transfer Protocol Secure)**
- **Cloud tiering** — frequently accessed files stay local, infrequent ones live in the cloud until needed
- Can act as a global cache network (multiple locations)
- Easy server replacement — just install on a new server, it re-syncs

--- 

#module5
# Describe Azure Directory Services

**Microsoft Entra ID** is Microsoft's cloud-based identity and access management service.

**What it does:**

- **Authentication** — MFA, SSO, self-service password reset, smart lockout
- **SSO (Single Sign-On)** — one login, access to many apps
- **App management** — cloud and on-premises apps
- **Device management** — via Microsoft Intune

**Microsoft Entra Connect** — syncs identities between on-premises AD and Entra ID (bi-directional)

**Microsoft Entra Domain Services** — managed domain services (domain join, group policy, LDAP, Kerberos/NTLM) without managing your own domain controllers.

> ⚠️ Sync is **one-way only**: Entra ID → Domain Services (not back)


## Describe Azure External Identities

For users **outside** your organisation (partners, vendors, customers, consumers).

| Type                   | Use case                                                        |
| ---------------------- | --------------------------------------------------------------- |
| **B2B collaboration**  | Guest users access your apps using their own identity           |
| **B2B direct connect** | Two-way trust between tenants, mainly for Teams shared channels |
| **Azure AD B2C**       | Consumer-facing apps (Google/Facebook login etc.)               |

## Describe Azure Authentication Methods

|Method|Security|Convenience|
|---|---|---|
|Password only|Low|High|
|MFA|Medium|Medium|
|Passwordless|**Highest**|**Highest**|

**MFA (Multifactor Authentication) factors:**

- Something you **know** (password)
- Something you **have** (phone code)
- Something you **are** (biometric)

**Passwordless options (3 to remember):**

- **Windows Hello for Business** — tied to a specific PC
- **Microsoft Authenticator app** — iOS/Android
- **FIDO2 security keys** — physical hardware (USB/NFC/Bluetooth), unphishable


## Describe Azure Conditional Access

Allows/denies access based on **signals**: who you are, where you are, what device you're using.

**Flow: Signal → Decision → Enforcement**

Use it to:

- Require MFA based on location or role
- Block access from untrusted locations
- Restrict access to managed devices only


## Describe Azure Role-Based Access Control

**Azure RBAC** controls **who can do what** on which resources. Based on the **principle of least privilege**.

- Applied to **scopes**: management group → subscription → resource group → resource
- **Hierarchical** — permissions are inherited downward
- Uses an **allow model** — multiple roles stack (read + write = both)
- Enforced through **Azure Resource Manager**
- Does **NOT** enforce app-level or data-level security

## Describe Zero Trust Model

"Never trust, always verify." Assumes breach from the start.

**3 principles:**

1. **Verify explicitly** — always authenticate using all available signals
2. **Use least privilege** — JIT/JEA (Just-In-Time / Just-Enough-Access)
3. **Assume breach** — segment access, encrypt end-to-end, use analytics

## Describe Defense-in-Depth

7 layers from outside → inside:

|Layer|Focus|
|---|---|
|**Physical**|Datacenter security|
|**Identity & Access**|SSO, MFA, audit logs|
|**Perimeter**|DDoS protection, firewalls|
|**Network**|Limit communication, deny by default|
|**Compute**|Patch VMs, endpoint protection|
|**Application**|Secure code, use Key Vault|
|**Data**|Encryption at rest and in transit ← what attackers are after|

## Describe Encryption and Key Management in Azure

- **Encryption at rest** — data stored in databases, disks, storage
- **Encryption in transit** — data moving between services/users

**Azure Key Vault** stores:

- Secrets (passwords, connection strings)
- Encryption keys
- Certificates

Used to avoid hardcoding credentials, rotate keys, audit access, and support compliance.

## Describe Microsoft Defender for Cloud

Security posture management across Azure, hybrid, and multicloud (AWS, GCP too).

**3 pillars:**

|Pillar|What it does|
|---|---|
|**Assess**|Continuously find vulnerabilities|
|**Secure**|Recommendations based on MCSB (Microsoft Cloud Security Benchmark), calculates a **secure score**|
|**Defend**|Security alerts, kill-chain analysis, advanced threat protection|



## ⚠️ Exam Tips — Common Confusions

- **Entra Connect** = sync tool (on-prem ↔ cloud, bi-directional)
- **Domain Services sync** = one-way only (cloud → domain services)
- **RBAC** = controls _what_ you can do; **Conditional Access** = controls _whether_ you can get in
- **Zero Trust** ≠ just MFA — it's a full security mindset
- **FIDO2** = hardware key, completely passwordless and unphishable 🔑
- **Azure Key Vault** = primary Azure service for secure key and secret storage
