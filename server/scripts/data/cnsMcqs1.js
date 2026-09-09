// CNS MCQs Part 1
module.exports = [
  { topic: 'OSI Model', question: 'OSI model has how many layers?', options: ['5', '6', '7', '8'], correctAnswer: 2, explanation: 'OSI (Open Systems Interconnection) model has 7 layers.', difficulty: 'easy' },
  { topic: 'OSI Model', question: 'Layer 1 of OSI is:', options: ['Data Link', 'Physical', 'Network', 'Transport'], correctAnswer: 1, explanation: 'Layer 1 is Physical layer - deals with physical transmission.', difficulty: 'easy' },
  { topic: 'OSI Model', question: 'Network layer is Layer:', options: ['1', '2', '3', '4'], correctAnswer: 2, explanation: 'Network layer is Layer 3 - handles routing and addressing.', difficulty: 'easy' },
  { topic: 'OSI Model', question: 'Transport layer is:', options: ['Layer 2', 'Layer 3', 'Layer 4', 'Layer 5'], correctAnswer: 2, explanation: 'Transport layer is Layer 4 - provides end-to-end communication.', difficulty: 'easy' },
  { topic: 'TCP/IP Model', question: 'TCP/IP has how many layers?', options: ['4', '5', '7', '6'], correctAnswer: 0, explanation: 'TCP/IP model has 4 layers: Application, Transport, Internet, Network Access.', difficulty: 'easy' },
  { topic: 'IP Addressing', question: 'IPv4 address length is:', options: ['16 bits', '32 bits', '64 bits', '128 bits'], correctAnswer: 1, explanation: 'IPv4 address is 32 bits (4 bytes) long.', difficulty: 'easy' },
  { topic: 'IPv4', question: 'IPv4 address in dotted decimal has:', options: ['2 parts', '3 parts', '4 parts', '5 parts'], correctAnswer: 2, explanation: 'IPv4 has 4 octets in dotted decimal notation (e.g., 192.168.1.1).', difficulty: 'easy' },
  { topic: 'IPv6', question: 'IPv6 address length is:', options: ['32 bits', '64 bits', '128 bits', '256 bits'], correctAnswer: 2, explanation: 'IPv6 address is 128 bits long.', difficulty: 'easy' },
  { topic: 'Subnetting', question: 'Subnet mask is used to:', options: ['Identify network and host portions', 'Encrypt data', 'Route packets', 'Assign MAC'], correctAnswer: 0, explanation: 'Subnet mask divides IP address into network and host portions.', difficulty: 'medium' },
  { topic: 'MAC Address', question: 'MAC address is:', options: ['32 bits', '48 bits', '64 bits', '128 bits'], correctAnswer: 1, explanation: 'MAC address is 48 bits (6 bytes) long.', difficulty: 'medium' },
  { topic: 'ARP', question: 'ARP is used to:', options: ['Resolve IP to MAC', 'Resolve MAC to IP', 'Route packets', 'Encrypt data'], correctAnswer: 0, explanation: 'ARP (Address Resolution Protocol) resolves IP address to MAC address.', difficulty: 'medium' },
  { topic: 'DNS', question: 'DNS is used to:', options: ['Assign IP', 'Resolve domain names to IP', 'Encrypt data', 'Route packets'], correctAnswer: 1, explanation: 'DNS (Domain Name System) resolves domain names to IP addresses.', difficulty: 'easy' },
  { topic: 'DHCP', question: 'DHCP is used to:', options: ['Resolve names', 'Assign IP addresses automatically', 'Route packets', 'Encrypt data'], correctAnswer: 1, explanation: 'DHCP (Dynamic Host Configuration Protocol) assigns IP addresses automatically.', difficulty: 'easy' },
  { topic: 'HTTP', question: 'HTTP uses port:', options: ['21', '22', '80', '443'], correctAnswer: 2, explanation: 'HTTP uses port 80 by default.', difficulty: 'easy' },
  { topic: 'HTTPS', question: 'HTTPS uses port:', options: ['80', '443', '21', '25'], correctAnswer: 1, explanation: 'HTTPS uses port 443 by default.', difficulty: 'easy' },
];
