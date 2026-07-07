/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Rule, Department, Faculty, Category } from '../types';

export const defaultCategories: Category[] = [
  { id: '1', name: 'Admissions', description: 'Admission procedures, eligibility, and intake details.' },
  { id: '2', name: 'Academics', description: 'Syllabus, timings, academic calendar, and exams.' },
  { id: '3', name: 'Placements', description: 'Placement statistics, drive schedules, and recruiters.' },
  { id: '4', name: 'Infrastructure', description: 'Hostel, transport, library, and lab facilities.' },
  { id: '5', name: 'Administration', description: 'Principal, HODs, faculty details, and office contacts.' },
  { id: '6', name: 'Student Life', description: 'Clubs, events, downloads, and general FAQs.' },
];

export const defaultDepartments: Department[] = [
  {
    id: 'CSE',
    name: 'Computer Science and Engineering',
    contactNumber: '+91-861-2313889 (Ext: 102)',
    email: 'cse.hod@necn.ac.in',
    location: 'Bhabha Block, 1st Floor',
  },
  {
    id: 'ECE',
    name: 'Electronics and Communication Engineering',
    contactNumber: '+91-861-2313889 (Ext: 104)',
    email: 'ece.hod@necn.ac.in',
    location: 'Ramanujan Block, Ground Floor',
  },
  {
    id: 'EEE',
    name: 'Electrical and Electronics Engineering',
    contactNumber: '+91-861-2313889 (Ext: 105)',
    email: 'eee.hod@necn.ac.in',
    location: 'Faraday Block, Ground Floor',
  },
  {
    id: 'MECH',
    name: 'Mechanical Engineering',
    contactNumber: '+91-861-2313889 (Ext: 106)',
    email: 'mech.hod@necn.ac.in',
    location: 'Visvesvaraya Block, 1st Floor',
  },
  {
    id: 'CIVIL',
    name: 'Civil Engineering',
    contactNumber: '+91-861-2313889 (Ext: 107)',
    email: 'civil.hod@necn.ac.in',
    location: 'Visvesvaraya Block, Ground Floor',
  },
  {
    id: 'ADMIN',
    name: 'College Administration Cell',
    contactNumber: '+91-861-2313869',
    email: 'admin@necn.ac.in',
    location: 'Main Administrative Block, Ground Floor',
  },
  {
    id: 'ADMISSIONS',
    name: 'Admission Cell',
    contactNumber: '+91-9440231386',
    email: 'admissions@necn.ac.in',
    location: 'Admission Block, Main Entrance',
  },
];

export const defaultFaculty: Faculty[] = [
  {
    id: 'F1',
    name: 'Dr.V.Ravi Prasad',
    designation: 'Principal',
    department: 'Administration',
    email: 'principal@necn.ac.in',
    contact: '+91-861-2313869',
  },
  {
    id: 'F2',
    name: 'Dr. C. Rajendra',
    designation: 'HOD',
    department: 'Computer Science and Engineering',
    email: 'cse.hod@necn.ac.in',
    contact: '+91-861-2313889',
  },
  {
    id: 'F3',
    name: 'Dr. K. Murali',
    designation: 'HOD',
    department: 'Electronics and Communication Engineering',
    email: 'ece.hod@necn.ac.in',
    contact: '+91-861-2313889',
  },
  {
    id: 'F4',
    name: 'Dr. G. Venkateswarlu',
    designation: 'HOD',
    department: 'Electrical and Electronics Engineering',
    email: 'eee.hod@necn.ac.in',
    contact: '+91-861-2313889',
  },
  {
    id: 'F5',
    name: 'Dr. B. Prasad',
    designation: 'HOD',
    department: 'Mechanical Engineering',
    email: 'mech.hod@necn.ac.in',
    contact: '+91-861-2313889',
  },
  {
    id: 'F6',
    name: 'Dr. T. Sunil',
    designation: 'HOD',
    department: 'Civil Engineering',
    email: 'civil.hod@necn.ac.in',
    contact: '+91-861-2313889',
  },
];

export const defaultRules: Rule[] = [
  // 1. Admissions
  {
    id: 'R1',
    category: 'Admissions',
    question: 'What is the admission process at NECN?',
    keywords: 'admission,apply,join,admission process,how to apply',
    synonyms: 'registration,entrance exam,eapcet,eamcet,eligibility',
    answer: 'Narayana Engineering College, Nellore (NECN) admissions are primarily based on entrance exams. For B.Tech, candidates must qualify in the AP EAPCET exam and participate in state counseling. Management quota admissions are also available based on 10+2 marks. You can apply online via the Admissions Portal or visit our campus Admission Cell.',
    relatedDepartment: 'ADMISSIONS',
    priority: 1,
    status: 'Active',
  },
  {
    id: 'R2',
    category: 'Admissions',
    question: 'What is the eligibility criteria for B.Tech admission?',
    keywords: 'eligibility,requirement,btech eligibility,qualification',
    synonyms: 'marks,percentage,criteria,requirements,b.tech eligibility',
    answer: 'Candidates must have passed 10+2 (Intermediate) examination with Mathematics, Physics, and Chemistry (MPC) as optional subjects with at least 45% marks (40% for reserved categories) and should have qualified in AP EAPCET.',
    relatedDepartment: 'ADMISSIONS',
    priority: 2,
    status: 'Active',
  },

  // 2. Fee Structure
  {
    id: 'R3',
    category: 'Fee Structure',
    question: 'What is the fee structure for B.Tech?',
    keywords: 'fee,fees,tuition fee,fee structure,cost,expense',
    synonyms: 'charge,charges,payment,btech fee,b.tech fees,price',
    answer: 'The annual tuition fee for B.Tech at NECN is approximately ₹43,000 per year for counseling quota (Convenor quota) candidates, as determined by the Andhra Pradesh Higher Education Regulatory and Monitoring Commission (AFRC). Transport, hostel, and university examination fees are charged separately.',
    relatedDepartment: 'ADMISSIONS',
    priority: 1,
    status: 'Active',
  },
  {
    id: 'R4',
    category: 'Fee Structure',
    question: 'What is the fee structure for MBA and MCA?',
    keywords: 'mba fee,mca fee,pg fees,mba cost,mca cost',
    synonyms: 'mba charges,mca charges,postgraduate fees',
    answer: 'The annual tuition fee for MBA and MCA programs is approximately ₹35,000 to ₹40,000 per year, strictly complying with the Andhra Pradesh government AFRC norms. Please visit the Admission Cell for a comprehensive breakdown.',
    relatedDepartment: 'ADMISSIONS',
    priority: 2,
    status: 'Active',
  },

  // 3. Departments
  {
    id: 'R5',
    category: 'Departments',
    question: 'What B.Tech departments are available at NECN?',
    keywords: 'departments,branches,courses,btech branches,specializations',
    synonyms: 'programs,btech courses,cse,ece,eee,civil,mechanical',
    answer: 'NECN offers B.Tech programs in Computer Science & Engineering (CSE), CSE-Artificial Intelligence & Machine Learning, CSE-Data Science, Electronics & Communication Engineering (ECE), Electrical & Electronics Engineering (EEE), Civil Engineering (Civil), and Mechanical Engineering (Mech).',
    relatedDepartment: 'ADMIN',
    priority: 1,
    status: 'Active',
  },

  // 4. Faculty and Leadership
  {
    id: 'R6',
    category: 'Principal',
    question: 'Who is the Principal of NECN?',
    keywords: 'principal,head,leader,who is principal',
    synonyms: 'dr g srinivasulu,dr. g. srinivasulu,srinivasulu,chief',
    answer: 'The Principal of Narayana Engineering College, Nellore is Dr. G. Srinivasulu. He holds a prestigious Ph.D. and has over 25 years of rich academic and administrative experience. You can reach his office at principal@necn.ac.in.',
    relatedDepartment: 'ADMIN',
    priority: 1,
    status: 'Active',
  },
  {
    id: 'R7',
    category: 'HOD',
    question: 'Who is the Computer Science (CSE) HOD?',
    keywords: 'cse hod,head of cse,cse head,hod computer science,computer science head',
    synonyms: 'dr c rajendra,dr. c. rajendra,rajendra,cse leader',
    answer: 'The Head of the Department (HOD) of Computer Science and Engineering (CSE) is Dr. C. Rajendra. His office is located on the 1st Floor of Bhabha Block. Contact: cse.hod@necn.ac.in.',
    relatedDepartment: 'CSE',
    priority: 1,
    status: 'Active',
  },
  {
    id: 'R8',
    category: 'HOD',
    question: 'Who is the Electronics and Communication (ECE) HOD?',
    keywords: 'ece hod,head of ece,ece head,hod electronics,electronics head',
    synonyms: 'dr k murali,dr. k. murali,murali,ece leader',
    answer: 'The Head of the Electronics & Communication Engineering (ECE) Department is Dr. K. Murali. His office is located on the Ground Floor of Ramanujan Block. Contact: ece.hod@necn.ac.in.',
    relatedDepartment: 'ECE',
    priority: 1,
    status: 'Active',
  },

  // 5. Placements
  {
    id: 'R9',
    category: 'Placements',
    question: 'What are the placement statistics and top recruiters?',
    keywords: 'placement,placements,jobs,salary,package,recruiters',
    synonyms: 'companies,hired,recruitment,tcs,wipro,infosys,highest package',
    answer: 'NECN has an outstanding placement track record with a dedicated Placement Cell. Over 85% of eligible students get placed annually. The highest package offered is ₹12 LPA, with an average package of ₹4.5 LPA. Top recruiters include TCS, Wipro, Infosys, Cognizant, Tech Mahindra, Mindtree, and Capgemini.',
    relatedDepartment: 'ADMIN',
    priority: 1,
    status: 'Active',
  },

  // 6. Infrastructure (Hostel, Transport, Library, Labs)
  {
    id: 'R10',
    category: 'Hostel',
    question: 'Does the college provide hostel facilities?',
    keywords: 'hostel,hostels,accommodation,stay,boarding',
    synonyms: 'boys hostel,girls hostel,mess,food,rooms,housing',
    answer: 'Yes, NECN provides premium separate hostel accommodation for both boys and girls inside/near the campus. Features include spacious ventilated rooms, 24/7 security, purified drinking water, hot water facilities, high-speed Wi-Fi, recreation rooms, and a highly hygienic mess serving delicious nutritious food.',
    relatedDepartment: 'ADMIN',
    priority: 1,
    status: 'Active',
  },
  {
    id: 'R11',
    category: 'Transport',
    question: 'Is college transport or bus facility available?',
    keywords: 'transport,bus,buses,route,routes,pick up,travel',
    synonyms: 'college bus,bus fee,commute,transportation,routes nellore',
    answer: 'Yes, NECN operates a fleet of comfortable buses connecting the college campus with all major parts of Nellore city, Kavali, Buchireddypalem, and surrounding villages. The buses are driven by experienced drivers and monitored via GPS for absolute safety.',
    relatedDepartment: 'ADMIN',
    priority: 1,
    status: 'Active',
  },
  {
    id: 'R12',
    category: 'Library',
    question: 'What are the library timings and resources?',
    keywords: 'library,books,journals,reading room,library hours',
    synonyms: 'library timing,digital library,delnet,study room',
    answer: 'The Central Library at NECN is fully computerized and open on all working days from 8:00 AM to 8:00 PM. It houses over 45,000 volumes, 120 national/international journals, plus digital library access to IEEE, DELNET, and NPTEL online courseware.',
    relatedDepartment: 'ADMIN',
    priority: 1,
    status: 'Active',
  },
  {
    id: 'R13',
    category: 'Laboratories',
    question: 'What laboratory facilities are available for students?',
    keywords: 'labs,laboratories,computer lab,chemistry lab,workshop,equipments',
    synonyms: 'lab,practical,equipment,it lab,mechanical lab',
    answer: 'Each department features state-of-the-art laboratory facilities. For CSE, we have modern computer labs with high-end Intel i7 processors and licensed software. ECE has advanced VLSI, DSP, and embedded systems labs. Civil and Mechanical feature advanced testing rigs, workshops, and CAD/CAM labs.',
    relatedDepartment: 'CSE',
    priority: 1,
    status: 'Active',
  },

  // 7. Scholarships
  {
    id: 'R14',
    category: 'Scholarships',
    question: 'Are scholarships available for students?',
    keywords: 'scholarship,scholarships,concession,fee waiver,financial aid',
    synonyms: 'jagananna vasathi deevena,jvd,vidya deevena,merit scholarship',
    answer: 'Eligible students can access AP Government Jagananna Vidya Deevena (JVD) for full tuition fee reimbursement, and Jagananna Vasathi Deevena for boarding charges. Additionally, NECN offers institutional merit scholarships to EAPCET top rankers and financial aid to underprivileged, highly talented candidates.',
    relatedDepartment: 'ADMIN',
    priority: 1,
    status: 'Active',
  },

  // 8. Timings & Contacts
  {
    id: 'R15',
    category: 'College Timings',
    question: 'What are the college and office timings?',
    keywords: 'college timings,office timings,class timings,working hours',
    synonyms: 'timing,time,college hours,class hours,lunch break',
    answer: 'Regular class timings at NECN are 9:00 AM to 4:40 PM from Monday to Saturday, with a lunch break from 12:40 PM to 1:40 PM. The Administrative Office is active from 8:30 AM to 5:30 PM on all working days.',
    relatedDepartment: 'ADMIN',
    priority: 1,
    status: 'Active',
  },
  {
    id: 'R16',
    category: 'Contact Numbers',
    question: 'What are the college contact numbers and email IDs?',
    keywords: 'contact numbers,email,phone,call,address,location',
    synonyms: 'phone number,email id,contact us,how to reach,support',
    answer: 'Narayana Engineering College (NECN) is located at Haranathapuram, Nellore, Andhra Pradesh - 524004. You can contact the reception at +91-861-2313869 or +91-861-2303869. Email queries can be sent to info@necn.ac.in or principal@necn.ac.in.',
    relatedDepartment: 'ADMIN',
    priority: 1,
    status: 'Active',
  },

  // 9. Extra curriculars
  {
    id: 'R17',
    category: 'Student Clubs',
    question: 'What student clubs and extracurricular options exist?',
    keywords: 'clubs,student clubs,sports,nss,ncc,cultural,activities',
    synonyms: 'hobby,hobbies,dancing,singing,cricket,volleyball,extra-curricular',
    answer: 'NECN fosters holistic development through active Student Clubs including the Robotics Club, Coding Club, Literary Club, Photography Club, NSS Unit, and Music/Cultural Club. The campus features excellent sports fields for cricket, basketball, volleyball, and indoor games, organizing annual sports meets.',
    relatedDepartment: 'ADMIN',
    priority: 1,
    status: 'Active',
  },
  {
    id: 'R18',
    category: 'Academic Calendar',
    question: 'Where can I find the Academic Calendar and Notices?',
    keywords: 'academic calendar,notices,notified,schedule,downloads',
    synonyms: 'timetable,exam calendar,syllabus book,pdf,downloads',
    answer: 'The academic calendar, exam timetables, and recent administrative announcements are published on the digital notices ticker in the main block and are also downloadable as PDF files directly from the "Downloads" tab of our official website (necn.ac.in).',
    relatedDepartment: 'ADMIN',
    priority: 1,
    status: 'Active',
  }
];
