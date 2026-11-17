#module1

# Whats cloud computing

*Computing services over the internet*

Main 
- compute power
- storage
- vm 
- db
- networking

New:
- IoT
- Machine Learning
- AI

Scale up or down quick as you need


# Share responsability model

In the old DC, consumer had to take care of everything 

Now they are share between the two parts -> 
Cloud resp:
- Physical security
- power
- cooling
- network connectivity 

Consumer  resp:
- personal data 
- access security

Sometimes it depends ...
- if in SQL you are responsible for the data and the cloud for the actual DB. 
- if you deploy a DB in VM, you are responseible also for the DB in the VM and the lcoud is just responsible for the VM

![[Pasted image 20260318154611.png]]

When using a cloud provider, you’ll always be responsible for:

- The information and data stored in the cloud
- Devices that are allowed to connect to your cloud (cell phones, computers, and so on)
- The accounts and identities of the people, services, and devices within your organization

The cloud provider is always responsible for:

- The physical datacenter
- The physical network
- The physical hosts

Your service model will determine responsibility for things like:

- Operating systems
- Network controls
- Applications
- Identity and infrastructure

# Define cloud models

Private cloud -> 
- cloud env used by one entity 
- comes from traditional datacenter model
- (higher costs and less benefits)

Public cloud -> 
- cloud built and control by third-party providers ( azure, aws, google cloud)

Hybrid -> 
- computing env that use both private and public
- good for:
	- handling tmp increase of demand
	- add extra security layers. 

Multilicloud (extra)-> 
- multiple public cloud providers for one solution 

some services that helps handling cloud envs
- **Azure Arc**
- **azure VMware solution** -> bring vm from dc to cloud


# Describe the consumption based 

**CapEx** -> up-front spending on physical infra.
**OpEx** -> ongoing spending on services over time. (*cloud computing*)

**cloud pricing** -> pay-as-you-go


*** 

#module2

# Describe the benefits of high availability and scalability in the cloud

## high availability
maximum uptime/availability regardless of disruptions

azure is highly available and uptime guarantees depending on the service.

Guarantees are part of the **service-level agreements** (SLAs).
- formal agreement between service provider and customer 
- on azure the uptime and downtime is in percentage. 
	- 100% is costly and almost impossible because there is no time for manteinance 
	- 99 and 99.99 make a huge difference 
	- each service in azure has its own SLAs

## Scalability

vertical -> if app needs more resources
horizontal -> if you demand increases 
![[Pasted image 20260516152340.png]]


# Describe the benefits of reliability and predictability in the cloud

**Reliability** is -> 
ability of a system to recover from failures and continue to function 
- if one region fails the other keep running (Pillar of the Azure Well-Architected Framework)

**Predictability** -> 
solution build under the Pillar of the Azure Well-Architected Framework and you can predict cost and preformance of the solution

- by **Performance*
	- concepts that support performance: Autoscaling, load balancing, and high availability
- by **cost**
	- focused on predicting or forecasting the cost of the cloud spend (Azure Pricing Calculator to get an estimate of potential cloud spend).

# Describe the benefits of security and governance in the cloud

![[Pasted image 20260516154409.png]]

# Describe the benefits of manageability in the cloud

**management of the cloud** ->  how the CLOUD xmanages your resources 

![[Pasted image 20260516154615.png]]


**management in the cloud** -> how YOU can manage your cloud resources
 
![[Pasted image 20260516154701.png]]


# Describe sustainability considerations in the cloud

-> this are practices to improve efficiency and be more sustainable 

![[Pasted image 20260516155013.png]]


*** 

#module3
# Cloud services types IaaS, PaaS , SaaS

# Infrastructure as a Service

provider is responsible ONLY for: 
- maintaining the hardware
- network connectivity to the internet
- physical security

customer is responsible for the rest like:
- operating systems
- patching
- configuration
- security control

![[Pasted image 20260516155720.png]]


when does IaaS make sence?
- **Lift-and-shift migration**: moving from onpremis to cloud
- **Testing and development**: replicate test or dev env

![[Pasted image 20260516160019.png]]


# Platform as a Service

the provider (in addition to IaaS), manages:
- OS
- middleware
- managed runtime
- developement tools
- analytics services

PaaS makes sense for: 
- **development framework**: Heroku, Render, Azure App Service
- **analytics or bussiness intelligence**: if you need azure insights or metrics or things like this

![[Pasted image 20260516160919.png]]


# Software as a Service

the customer only manages:
- their data
- identity and access settings
- device access posture.

![[Pasted image 20260516161752.png]]