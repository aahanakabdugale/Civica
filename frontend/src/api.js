// API client for Civica Grievance Redressal
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Seed demo complaints for instant lookup and demo presentations
const DEMO_COMPLAINTS = [
  {
    id: 'CIV-1001',
    title: 'Deep crater pothole near Sector 4 Market crossing',
    category: 'roads',
    categoryName: 'Roads & Infrastructure',
    description: 'A large dangerous crater has formed after recent rains on the main crossing. Two two-wheelers skidded yesterday. Immediate asphalt repair needed before peak rush hour.',
    urgency: 'high',
    priority: 'High',
    status: 'in_progress',
    statusStep: 4, // 1: submitted, 2: classified, 3: assigned, 4: in_progress, 5: resolved
    department: 'Municipal Roads & Highway Maintenance',
    ward: 'Ward 14 - Central District',
    location: {
      lat: 28.6139,
      lng: 77.2090,
      address: 'Main Crossing, Near Gate 2, Sector 4 Commercial Complex',
    },
    citizen: {
      name: 'Rajesh Sharma',
      phone: '+91 98765 43210',
      email: 'rajesh.s@example.com',
      isAnonymous: false,
    },
    filedAt: new Date(Date.now() - 28 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    estimatedResolution: 'Today by 6:00 PM',
    officerNotes: 'Inspection team dispatched with cold asphalt patch crew. Work in progress under Supervisor S. Verma.',
    duplicateInfo: {
      isDuplicate: false,
      clusterCount: 4,
      clusterMessage: '4 nearby citizens reported this same road hazard within 200m. Prioritized as collective urgency.',
    },
    images: [
      'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=600&q=80'
    ]
  },
  {
    id: 'CIV-1002',
    title: 'Overflowing commercial waste bin near Public Park Gate 1',
    category: 'sanitation',
    categoryName: 'Solid Waste & Sanitation',
    description: 'Garbage dumpsters have not been cleared for 4 days. Stray animals scattering plastic across the walking track. Foul odor causing breathing issues for morning joggers.',
    urgency: 'medium',
    priority: 'Medium',
    status: 'resolved',
    statusStep: 5,
    department: 'Sanitation & Public Health Department',
    ward: 'Ward 08 - Green Park Sector',
    location: {
      lat: 28.5589,
      lng: 77.2028,
      address: 'Public Garden Gate 1, Ring Road Corner',
    },
    citizen: {
      name: 'Ananya Roy',
      phone: '+91 98112 34567',
      email: 'ananya@example.com',
      isAnonymous: false,
    },
    filedAt: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
    estimatedResolution: 'Resolved',
    officerNotes: 'Waste cleared using hydraulic compactor truck #DL-04-8902. Area sanitized and chemical disinfectant sprayed.',
    duplicateInfo: {
      isDuplicate: true,
      masterId: 'CIV-0994',
      clusterMessage: 'Merged with area sanitation sweep ticket #CIV-0994.',
    },
    images: [
      'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=600&q=80'
    ]
  },
  {
    id: 'CIV-1003',
    title: 'High-pressure water main pipeline burst flooding service lane',
    category: 'water',
    categoryName: 'Water Supply & Sewerage',
    description: 'Underground potable water pipe ruptured under excessive pressure. Potable water gushing onto the road and entering ground-floor basements.',
    urgency: 'critical',
    priority: 'Critical Emergency',
    status: 'in_progress',
    statusStep: 4,
    department: 'Jal Board & Emergency Water Response',
    ward: 'Ward 22 - Industrial Sector',
    location: {
      lat: 28.6328,
      lng: 77.2197,
      address: 'Plot 45, Service Lane 3, Industrial Area Phase 1',
    },
    citizen: {
      name: 'Vikram Mehta',
      phone: '+91 99988 77665',
      isAnonymous: true,
    },
    filedAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    estimatedResolution: 'Within 2 Hours (SLA Expedited)',
    officerNotes: 'Main isolation valve #V-12 shut off. Emergency excavation vehicle on site to replace 12-inch cast iron segment.',
    duplicateInfo: {
      isDuplicate: false,
      clusterCount: 7,
      clusterMessage: '7 concurrent calls detected in 100m radius. Critical severity auto-escalated to Zonal Director.',
    },
    images: [
      'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80'
    ]
  },
  {
    id: 'CIV-1004',
    title: 'Non-functional streetlights on school corridor lane',
    category: 'electricity',
    categoryName: 'Electrical & Street Lighting',
    description: 'Entire row of 6 streetlights dead for the past week. Pitch dark after 6:30 PM creating severe safety concerns for students and women returning from coaching classes.',
    urgency: 'medium',
    priority: 'Medium',
    status: 'assigned',
    statusStep: 3,
    department: 'Municipal Electrical & Energy Division',
    ward: 'Ward 03 - South Zone',
    location: {
      lat: 28.5355,
      lng: 77.2410,
      address: 'School Lane behind Bal Bharati Vidya Mandir',
    },
    citizen: {
      name: 'Pooja Deshmukh',
      phone: '+91 97654 12345',
      isAnonymous: false,
    },
    filedAt: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 3600 * 1000).toISOString(),
    estimatedResolution: 'Tomorrow by 12:00 PM',
    officerNotes: 'Transformer feeder fuse diagnosed with phase fault. Replacement line team assigned for morning shift.',
    duplicateInfo: null,
    images: []
  }
];

// Helper to initialize local storage database
const getStoredComplaints = () => {
  try {
    const raw = localStorage.getItem('civica_complaints_store');
    if (!raw) {
      localStorage.setItem('civica_complaints_store', JSON.stringify(DEMO_COMPLAINTS));
      return DEMO_COMPLAINTS;
    }
    return JSON.parse(raw);
  } catch {
    return DEMO_COMPLAINTS;
  }
};

const saveStoredComplaints = (list) => {
  try {
    localStorage.setItem('civica_complaints_store', JSON.stringify(list));
  } catch (err) {
    console.warn('Could not save to localStorage:', err);
  }
};

// Auto AI categorization & priority estimation mock engine
const simulateAiAnalysis = (data) => {
  const text = `${data.title} ${data.description}`.toLowerCase();
  
  let detectedDept = 'General Municipal Works';
  let priority = 'Medium';

  if (text.includes('pothole') || text.includes('road') || text.includes('accident') || text.includes('asphalt')) {
    detectedDept = 'Roads & Infrastructure Department';
  } else if (text.includes('garbage') || text.includes('trash') || text.includes('waste') || text.includes('smell') || text.includes('drain')) {
    detectedDept = 'Solid Waste & Sanitation Department';
  } else if (text.includes('water') || text.includes('leak') || text.includes('pipe') || text.includes('flood')) {
    detectedDept = 'Water Supply & Sewerage Board';
  } else if (text.includes('light') || text.includes('electric') || text.includes('wire') || text.includes('dark')) {
    detectedDept = 'Electrical & Street Lighting Division';
  } else if (text.includes('encroach') || text.includes('illegal') || text.includes('hawker')) {
    detectedDept = 'Town Planning & Enforcement Cell';
  }

  if (data.urgency === 'critical' || text.includes('fire') || text.includes('burst') || text.includes('live wire') || text.includes('danger')) {
    priority = 'Critical Emergency';
  } else if (data.urgency === 'high' || text.includes('accident') || text.includes('injury') || text.includes('deep')) {
    priority = 'High';
  } else if (data.urgency === 'low') {
    priority = 'Low';
  }

  return { detectedDept, priority };
};

/**
 * Submit a citizen complaint
 * Integrates with POST /complaints, with fallback to local store
 */
export const submitComplaint = async (formData) => {
  // Generate high-visibility unique tracking ID e.g. CIV-84920
  const randomSuffix = Math.floor(10000 + Math.random() * 90000);
  const newId = `CIV-${randomSuffix}`;
  
  const { detectedDept, priority } = simulateAiAnalysis(formData);

  const complaintPayload = {
    id: newId,
    title: formData.title,
    category: formData.category || 'other',
    categoryName: formData.categoryName || 'General Civic Issue',
    description: formData.description,
    urgency: formData.urgency || 'medium',
    priority: priority,
    status: 'submitted',
    statusStep: 1, // Freshly submitted
    department: detectedDept,
    ward: formData.location?.ward || 'Ward 12 - Municipal North',
    location: {
      lat: formData.location?.lat || 28.6139,
      lng: formData.location?.lng || 77.2090,
      address: formData.location?.address || 'Location coordinates recorded',
    },
    citizen: {
      name: formData.citizen?.isAnonymous ? 'Anonymous Citizen' : (formData.citizen?.name || 'Citizen'),
      phone: formData.citizen?.phone || '',
      email: formData.citizen?.email || '',
      isAnonymous: Boolean(formData.citizen?.isAnonymous),
    },
    filedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    estimatedResolution: priority === 'Critical Emergency' ? 'Within 4 Hours' : 'Within 24-48 Hours',
    officerNotes: 'Complaint received and vector embedding indexed for duplicate screening.',
    duplicateInfo: null,
    images: formData.images || [],
  };

  try {
    // Attempt real backend call
    const response = await fetch(`${API_BASE_URL}/complaints`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(complaintPayload),
      // 3 second timeout for network responsiveness
      signal: AbortSignal.timeout(3000)
    });

    if (response.ok) {
      const data = await response.json();
      // Also cache locally
      const current = getStoredComplaints();
      saveStoredComplaints([data, ...current]);
      return { success: true, data };
    }
  } catch {
    // Graceful offline fallback
    console.info('Backend unreachable, using client-side store for grievance submission.');
  }

  // Fallback to local storage store
  const current = getStoredComplaints();
  const updated = [complaintPayload, ...current];
  saveStoredComplaints(updated);

  // Artificial short delay for realistic AI analysis animation
  await new Promise((resolve) => setTimeout(resolve, 800));

  return {
    success: true,
    data: complaintPayload,
  };
};

/**
 * Fetch a single complaint by tracking ID
 */
export const getComplaintById = async (complaintId) => {
  if (!complaintId) return { success: false, error: 'Complaint ID is required' };
  
  const cleanId = complaintId.trim().toUpperCase();

  try {
    const response = await fetch(`${API_BASE_URL}/complaints/${cleanId}`, {
      signal: AbortSignal.timeout(3000)
    });
    if (response.ok) {
      const data = await response.json();
      return { success: true, data };
    }
  } catch {
    // Fallback to local
  }

  const stored = getStoredComplaints();
  const match = stored.find(
    (item) => item.id.toUpperCase() === cleanId || item.id.replace('-', '').toUpperCase() === cleanId.replace('-', '')
  );

  if (match) {
    return { success: true, data: match };
  }

  return {
    success: false,
    error: `Complaint ID "${complaintId}" not found. Please verify the ID.`,
  };
};

/**
 * Get recent sample complaints for quick demo chips
 */
export const getRecentComplaints = async () => {
  return getStoredComplaints();
};
