/** Questions whose stored (Examprepper) answer conflicts with Microsoft Learn. Shown as a warning under the explanation. */
export const DISPUTES: Record<number, string> = {
  147: 'Disputed: Microsoft Learn automates Sentinel responses with playbooks (Azure Logic Apps). None of the options is a playbook, so the stored answer (workbooks) is the expected exam pick, but workbooks only visualize data.',
  198: 'Disputed: Microsoft Learn points to Compliance Manager (Service Trust Portal / Microsoft Purview) and the Defender for Cloud regulatory compliance dashboard for this. The stored answer (Solutions blade) is what most of the community picked. Know both.',
  166: 'Disputed: the question asks for two solutions but only one is stored. Per Microsoft Learn an Azure Firewall DNAT rule can also publish a VM over HTTP, so "Modify an Azure firewall" is likely the second answer.',
  179: 'Disputed: per Microsoft Learn an Azure Firewall DNAT rule can publish a VM over HTTP, so "Yes" is defensible. The stored answer is No (64% of the community).',
  322: 'Disputed: Microsoft Learn lists premium page blob accounts as StorageV2 (general-purpose v2), so the third statement may be Yes. The stored answer is No.',
  21: 'Disputed: Microsoft Learn names Azure Monitor (Log Analytics workspace) as the central repository for collected data. The stored answer (Event Hubs) is what the exam key expects: it ingests events from many sources.',
  219: 'Disputed: per Microsoft Learn, Professional Direct is the lowest-cost plan with architectural guidance, which would make "Yes" correct. The stored answer is No.',
};
