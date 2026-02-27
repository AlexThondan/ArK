const connectDB = require("../config/db");
const { loadEnv } = require("../config/env");
const User = require("../models/User");
const Employee = require("../models/Employee");
const Client = require("../models/Client");
const Team = require("../models/Team");
const Project = require("../models/Project");
const Task = require("../models/Task");
const Leave = require("../models/Leave");
const Attendance = require("../models/Attendance");
const { generateEmployeeId } = require("../utils/employeeId");

const DEFAULT_EMPLOYEE_PASSWORD = process.env.SEED_EMPLOYEE_PASSWORD || "Emp@12345";

const toUtcDate = (yyyyMmDd, hours = 0, minutes = 0) => {
  const [year, month, day] = yyyyMmDd.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, hours, minutes, 0));
};

const toIsoDate = (date) => new Date(date).toISOString().slice(0, 10);

const daysAgoIso = (daysAgo) => {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - daysAgo);
  return date.toISOString().slice(0, 10);
};

const ensureUser = async ({ email, role = "employee", password = DEFAULT_EMPLOYEE_PASSWORD }) => {
  const normalized = String(email || "").trim().toLowerCase();
  let user = await User.findOne({ email: normalized });
  if (!user) {
    user = await User.create({
      email: normalized,
      password,
      role
    });
  } else {
    const patch = {};
    if (user.role !== role) patch.role = role;
    if (!user.isActive) patch.isActive = true;
    if (Object.keys(patch).length) {
      user = await User.findByIdAndUpdate(user._id, patch, { new: true });
    }
  }

  return user;
};

const ensureEmployee = async (userId, profile) => {
  let employee = await Employee.findOne({ user: userId });
  if (!employee) {
    const employeeId = profile.employeeId || await generateEmployeeId();
    employee = await Employee.create({
      ...profile,
      employeeId,
      user: userId
    });
    return employee;
  }

  Object.assign(employee, profile);
  if (!employee.employeeId) {
    employee.employeeId = await generateEmployeeId();
  }
  await employee.save();
  return employee;
};

const ensureClient = async (query, payload) => Client.findOneAndUpdate(query, { $set: payload }, { new: true, upsert: true });

const ensureTeam = async (query, payload) => Team.findOneAndUpdate(query, { $set: payload }, { new: true, upsert: true });

const ensureProject = async (query, payload) => Project.findOneAndUpdate(query, { $set: payload }, { new: true, upsert: true });

const ensureTask = async (query, payload) => Task.findOneAndUpdate(query, { $set: payload }, { new: true, upsert: true });

const ensureLeave = async (query, payload) => Leave.findOneAndUpdate(query, { $set: payload }, { new: true, upsert: true });

const ensureAttendance = async (query, payload) =>
  Attendance.findOneAndUpdate(query, { $set: payload }, { new: true, upsert: true, setDefaultsOnInsert: true });

const run = async () => {
  const env = loadEnv();
  await connectDB(env.MONGO_URI);

  const adminEmail = String(process.env.SEED_ADMIN_EMAIL || "admin@hrms.com").trim().toLowerCase();
  const adminUser = await User.findOne({ email: adminEmail, role: "admin" });
  if (!adminUser) {
    throw new Error(`Admin user not found: ${adminEmail}. Run npm run seed:admin first.`);
  }

  await ensureEmployee(adminUser._id, {
    firstName: "System",
    lastName: "Admin",
    department: "Administration",
    designation: "HR Head",
    phone: "+1 555 000 1000",
    personalEmail: adminEmail,
    gender: "prefer-not-to-say",
    maritalStatus: "prefer-not-to-say",
    nationality: "Indian",
    salary: 185000,
    joinDate: new Date("2023-01-15"),
    workMode: "onsite",
    employmentType: "full-time",
    experience: { totalYears: 12, previousCompany: "PeopleOps Global" },
    address: {
      line1: "Admin Tower",
      city: "Bengaluru",
      state: "Karnataka",
      country: "India",
      postalCode: "560001"
    },
    leaveBalance: { annual: 25, sick: 12, casual: 8 }
  });

  const employeeSeeds = [
    {
      email: "ananya.sharma@arkhrms.com",
      firstName: "Ananya",
      lastName: "Sharma",
      department: "Engineering",
      designation: "Senior Software Engineer",
      phone: "+1 555 100 0101",
      personalEmail: "ananya.sharma@gmail.com",
      dob: new Date("1996-03-12"),
      gender: "female",
      maritalStatus: "single",
      nationality: "Indian",
      salary: 135000,
      joinDate: new Date("2024-01-10"),
      manager: adminUser._id,
      workMode: "hybrid",
      employmentType: "full-time",
      emergencyContact: { name: "Rakesh Sharma", relation: "Father", phone: "+1 555 100 0199" },
      experience: { totalYears: 6, previousCompany: "ByteLoop Labs" },
      bio: "Leads backend reliability initiatives and release quality.",
      address: { line1: "17 Sunrise Ave", city: "Pune", state: "Maharashtra", country: "India", postalCode: "411001" },
      skills: ["Node.js", "MongoDB", "System Design"],
      leaveBalance: { annual: 18, sick: 9, casual: 6 }
    },
    {
      email: "rohit.verma@arkhrms.com",
      firstName: "Rohit",
      lastName: "Verma",
      department: "Engineering",
      designation: "QA Engineer",
      phone: "+1 555 100 0202",
      personalEmail: "rohit.verma@gmail.com",
      dob: new Date("1998-08-23"),
      gender: "male",
      maritalStatus: "single",
      nationality: "Indian",
      salary: 92000,
      joinDate: new Date("2024-04-08"),
      manager: adminUser._id,
      workMode: "onsite",
      employmentType: "full-time",
      emergencyContact: { name: "Sunita Verma", relation: "Mother", phone: "+1 555 100 0299" },
      experience: { totalYears: 3, previousCompany: "ClearTest Tech" },
      bio: "Owns test automation pipelines and regression quality.",
      address: { line1: "29 Maple Street", city: "Noida", state: "Uttar Pradesh", country: "India", postalCode: "201301" },
      skills: ["Playwright", "API Testing", "CI/CD"],
      leaveBalance: { annual: 16, sick: 10, casual: 7 }
    },
    {
      email: "neha.kapoor@arkhrms.com",
      firstName: "Neha",
      lastName: "Kapoor",
      department: "Design",
      designation: "Product Designer",
      phone: "+1 555 100 0303",
      personalEmail: "neha.kapoor@gmail.com",
      dob: new Date("1995-11-04"),
      gender: "female",
      maritalStatus: "married",
      nationality: "Indian",
      salary: 105000,
      joinDate: new Date("2023-10-17"),
      manager: adminUser._id,
      workMode: "remote",
      employmentType: "contract",
      emergencyContact: { name: "Aman Kapoor", relation: "Spouse", phone: "+1 555 100 0399" },
      experience: { totalYears: 7, previousCompany: "PixelArc Studio" },
      bio: "Designs employee-facing workflows and UX standards.",
      address: { line1: "44 Lake View", city: "Jaipur", state: "Rajasthan", country: "India", postalCode: "302001" },
      skills: ["Figma", "Design Systems", "User Research"],
      leaveBalance: { annual: 14, sick: 8, casual: 6 }
    },
    {
      email: "vivek.iyer@arkhrms.com",
      firstName: "Vivek",
      lastName: "Iyer",
      department: "Sales",
      designation: "Account Executive",
      phone: "+1 555 100 0404",
      personalEmail: "vivek.iyer@gmail.com",
      dob: new Date("1994-06-28"),
      gender: "male",
      maritalStatus: "married",
      nationality: "Indian",
      salary: 98000,
      joinDate: new Date("2024-02-05"),
      manager: adminUser._id,
      workMode: "onsite",
      employmentType: "full-time",
      emergencyContact: { name: "Priya Iyer", relation: "Spouse", phone: "+1 555 100 0499" },
      experience: { totalYears: 8, previousCompany: "LeadBridge CRM" },
      bio: "Handles enterprise accounts and annual renewals.",
      address: { line1: "9 Tech Park Road", city: "Chennai", state: "Tamil Nadu", country: "India", postalCode: "600001" },
      skills: ["B2B Sales", "Negotiation", "CRM"],
      leaveBalance: { annual: 17, sick: 8, casual: 7 }
    },
    {
      email: "fatima.khan@arkhrms.com",
      firstName: "Fatima",
      lastName: "Khan",
      department: "HR",
      designation: "HR Executive",
      phone: "+1 555 100 0505",
      personalEmail: "fatima.khan@gmail.com",
      dob: new Date("1997-09-09"),
      gender: "female",
      maritalStatus: "single",
      nationality: "Indian",
      salary: 82000,
      joinDate: new Date("2024-05-13"),
      manager: adminUser._id,
      workMode: "hybrid",
      employmentType: "part-time",
      emergencyContact: { name: "Naseem Khan", relation: "Mother", phone: "+1 555 100 0599" },
      experience: { totalYears: 4, previousCompany: "PeopleWorks Pvt Ltd" },
      bio: "Owns onboarding, engagement events, and leave coordination.",
      address: { line1: "31 Metro Enclave", city: "Hyderabad", state: "Telangana", country: "India", postalCode: "500001" },
      skills: ["People Operations", "Policy", "Onboarding"],
      leaveBalance: { annual: 19, sick: 10, casual: 8 }
    }
  ];

  const employeeUsers = [];
  const employeeProfiles = [];
  for (const seed of employeeSeeds) {
    // eslint-disable-next-line no-await-in-loop
    const user = await ensureUser({ email: seed.email, role: "employee" });
    employeeUsers.push(user);
    // eslint-disable-next-line no-await-in-loop
    const profile = await ensureEmployee(user._id, seed);
    employeeProfiles.push(profile);
  }

  const usersByEmail = new Map(employeeUsers.map((user) => [user.email, user]));
  const profilesByEmail = new Map(
    employeeSeeds.map((seed, idx) => [seed.email, employeeProfiles[idx]])
  );

  const clientA = await ensureClient(
    { company: "BlueOrbit Systems" },
    {
      name: "Samantha Reed",
      company: "BlueOrbit Systems",
      contactRole: "Director of Operations",
      email: "samantha.reed@blueorbit.com",
      phone: "+1 555 300 1010",
      address: "742 Market Street, San Francisco",
      industry: "SaaS",
      website: "https://blueorbit.example.com",
      timezone: "America/Los_Angeles",
      country: "United States",
      state: "California",
      city: "San Francisco",
      contractValue: 180000,
      status: "active",
      notes: "Strategic multi-year platform client."
    }
  );

  const clientB = await ensureClient(
    { company: "Nexa Retail Group" },
    {
      name: "Lucas Bennett",
      company: "Nexa Retail Group",
      contactRole: "VP, People Operations",
      email: "lucas.bennett@nexaretail.com",
      phone: "+1 555 300 2020",
      address: "1200 5th Ave, Seattle",
      industry: "Retail",
      website: "https://nexa-retail.example.com",
      timezone: "America/Los_Angeles",
      country: "United States",
      state: "Washington",
      city: "Seattle",
      contractValue: 125000,
      status: "active",
      notes: "Needs monthly analytics and attendance exports."
    }
  );

  const engineeringTeam = await ensureTeam(
    { code: "ENG-CORE" },
    {
      name: "Engineering Core",
      code: "ENG-CORE",
      department: "Engineering",
      description: "Core product engineering and platform quality.",
      lead: usersByEmail.get("ananya.sharma@arkhrms.com")._id,
      members: [
        { user: usersByEmail.get("ananya.sharma@arkhrms.com")._id, teamRole: "Tech Lead" },
        { user: usersByEmail.get("rohit.verma@arkhrms.com")._id, teamRole: "QA Engineer" },
        { user: usersByEmail.get("neha.kapoor@arkhrms.com")._id, teamRole: "Product Designer" }
      ],
      isActive: true
    }
  );

  const operationsTeam = await ensureTeam(
    { code: "OPS-PEOPLE" },
    {
      name: "People Operations",
      code: "OPS-PEOPLE",
      department: "HR",
      description: "HR operations, hiring, and workforce enablement.",
      lead: usersByEmail.get("fatima.khan@arkhrms.com")._id,
      members: [
        { user: usersByEmail.get("fatima.khan@arkhrms.com")._id, teamRole: "HR Lead" },
        { user: usersByEmail.get("vivek.iyer@arkhrms.com")._id, teamRole: "Business Partner" }
      ],
      isActive: true
    }
  );

  const projectA = await ensureProject(
    { code: "101" },
    {
      name: "Employee Self Service Portal",
      code: "101",
      description: "Improve employee self-service workflows for profile, leave, and docs.",
      client: clientA._id,
      members: [
        usersByEmail.get("ananya.sharma@arkhrms.com")._id,
        usersByEmail.get("rohit.verma@arkhrms.com")._id,
        usersByEmail.get("neha.kapoor@arkhrms.com")._id
      ],
      assignmentType: "individual",
      assignedTeam: null,
      startDate: new Date("2026-01-10"),
      endDate: new Date("2026-03-30"),
      budget: 62000,
      status: "active",
      progress: 62
    }
  );

  const projectB = await ensureProject(
    { code: "102" },
    {
      name: "Retail Workforce Analytics",
      code: "102",
      description: "Attendance and productivity analytics for multi-store retail teams.",
      client: clientB._id,
      members: engineeringTeam.members.map((row) => row.user),
      assignmentType: "team",
      assignedTeam: engineeringTeam._id,
      startDate: new Date("2026-01-20"),
      endDate: new Date("2026-04-15"),
      budget: 85000,
      status: "active",
      progress: 44
    }
  );

  const projectC = await ensureProject(
    { code: "103" },
    {
      name: "Campus Hiring Drive 2026",
      code: "103",
      description: "Hiring funnel digitization and onboarding automation.",
      client: clientB._id,
      members: operationsTeam.members.map((row) => row.user),
      assignmentType: "team",
      assignedTeam: operationsTeam._id,
      startDate: new Date("2026-02-01"),
      endDate: new Date("2026-05-20"),
      budget: 40000,
      status: "planning",
      progress: 18
    }
  );

  const taskSeeds = [
    {
      title: "Implement secure leave approval API",
      assignedTo: usersByEmail.get("ananya.sharma@arkhrms.com")._id,
      project: projectA._id,
      assignedTeam: engineeringTeam._id,
      priority: "high",
      status: "in-progress",
      progress: 65,
      dueDate: new Date("2026-03-05")
    },
    {
      title: "Automate regression suite for attendance module",
      assignedTo: usersByEmail.get("rohit.verma@arkhrms.com")._id,
      project: projectA._id,
      assignedTeam: engineeringTeam._id,
      priority: "medium",
      status: "todo",
      progress: 10,
      dueDate: new Date("2026-03-08")
    },
    {
      title: "Design profile completion onboarding flow",
      assignedTo: usersByEmail.get("neha.kapoor@arkhrms.com")._id,
      project: projectA._id,
      assignedTeam: engineeringTeam._id,
      priority: "high",
      status: "done",
      progress: 100,
      dueDate: new Date("2026-02-24")
    },
    {
      title: "Build department productivity report cards",
      assignedTo: usersByEmail.get("ananya.sharma@arkhrms.com")._id,
      project: projectB._id,
      assignedTeam: engineeringTeam._id,
      priority: "critical",
      status: "in-progress",
      progress: 52,
      dueDate: new Date("2026-03-11")
    },
    {
      title: "Validate export accuracy for attendance CSV",
      assignedTo: usersByEmail.get("rohit.verma@arkhrms.com")._id,
      project: projectB._id,
      assignedTeam: engineeringTeam._id,
      priority: "medium",
      status: "done",
      progress: 100,
      dueDate: new Date("2026-02-26")
    },
    {
      title: "Draft recruiter KPI dashboard wireframes",
      assignedTo: usersByEmail.get("neha.kapoor@arkhrms.com")._id,
      project: projectC._id,
      assignedTeam: operationsTeam._id,
      priority: "medium",
      status: "todo",
      progress: 0,
      dueDate: new Date("2026-03-16")
    },
    {
      title: "Prepare enterprise renewal proposal",
      assignedTo: usersByEmail.get("vivek.iyer@arkhrms.com")._id,
      project: projectC._id,
      assignedTeam: operationsTeam._id,
      priority: "high",
      status: "in-progress",
      progress: 48,
      dueDate: new Date("2026-03-13")
    },
    {
      title: "Publish revised leave policy handbook",
      assignedTo: usersByEmail.get("fatima.khan@arkhrms.com")._id,
      project: projectC._id,
      assignedTeam: operationsTeam._id,
      priority: "low",
      status: "done",
      progress: 100,
      dueDate: new Date("2026-02-22")
    },
    {
      title: "Close sprint blockers for payroll sync",
      assignedTo: usersByEmail.get("ananya.sharma@arkhrms.com")._id,
      project: projectB._id,
      assignedTeam: engineeringTeam._id,
      priority: "critical",
      status: "blocked",
      progress: 35,
      dueDate: new Date("2026-03-07")
    }
  ];

  for (const item of taskSeeds) {
    // eslint-disable-next-line no-await-in-loop
    await ensureTask(
      { title: item.title, assignedTo: item.assignedTo, project: item.project },
      {
        ...item,
        assignedBy: adminUser._id,
        description: `${item.title} - seeded task`,
        checklists: [
          { title: "Plan scope", description: "Define clear acceptance criteria", isChecked: item.progress >= 30 },
          { title: "Execute implementation", description: "Deliver expected output", isChecked: item.progress >= 75 },
          { title: "Review and close", description: "Validate and sign off", isChecked: item.progress >= 100 }
        ]
      }
    );
  }

  const leaveSeeds = [
    {
      email: "ananya.sharma@arkhrms.com",
      leaveType: "annual",
      startDate: new Date("2026-03-20"),
      endDate: new Date("2026-03-22"),
      days: 3,
      reason: "Family travel",
      status: "pending"
    },
    {
      email: "rohit.verma@arkhrms.com",
      leaveType: "sick",
      startDate: new Date("2026-02-17"),
      endDate: new Date("2026-02-18"),
      days: 2,
      reason: "Seasonal flu and recovery",
      status: "approved",
      reviewedAt: new Date("2026-02-16")
    },
    {
      email: "fatima.khan@arkhrms.com",
      leaveType: "casual",
      startDate: new Date("2026-02-25"),
      endDate: new Date("2026-02-25"),
      days: 1,
      reason: "Personal errand",
      status: "approved",
      reviewedAt: new Date("2026-02-24")
    },
    {
      email: "vivek.iyer@arkhrms.com",
      leaveType: "annual",
      startDate: new Date("2026-03-02"),
      endDate: new Date("2026-03-04"),
      days: 3,
      reason: "Client offsite travel overlap",
      status: "rejected",
      reviewedAt: new Date("2026-02-28")
    }
  ];

  for (const leave of leaveSeeds) {
    const user = usersByEmail.get(leave.email);
    const profile = profilesByEmail.get(leave.email);
    // eslint-disable-next-line no-await-in-loop
    await ensureLeave(
      { user: user._id, startDate: leave.startDate, endDate: leave.endDate, leaveType: leave.leaveType },
      {
        user: user._id,
        departmentSnapshot: profile.department,
        leaveType: leave.leaveType,
        startDate: leave.startDate,
        endDate: leave.endDate,
        days: leave.days,
        reason: leave.reason,
        handoverNotes: "Work handover added in task board.",
        contactDuringLeave: profile.phone,
        status: leave.status,
        reviewedBy: leave.status === "pending" ? null : adminUser._id,
        reviewedAt: leave.reviewedAt || null,
        reviewComment: leave.status === "rejected" ? "Critical release week overlap." : "Approved"
      }
    );
  }

  for (let daysAgo = 0; daysAgo < 7; daysAgo += 1) {
    const dateIso = daysAgoIso(daysAgo);
    for (let index = 0; index < employeeSeeds.length; index += 1) {
      const seed = employeeSeeds[index];
      const user = usersByEmail.get(seed.email);
      const profile = profilesByEmail.get(seed.email);
      const pattern = (daysAgo + index) % 8;

      let status = "present";
      if (pattern === 0) status = "on-leave";
      if (pattern === 1) status = "half-day";

      if (status === "on-leave") {
        // eslint-disable-next-line no-await-in-loop
        await ensureAttendance(
          { user: user._id, date: toUtcDate(dateIso, 0, 0) },
          {
            user: user._id,
            departmentSnapshot: profile.department,
            date: toUtcDate(dateIso, 0, 0),
            checkIn: null,
            checkOut: null,
            workDurationMinutes: 0,
            status: "on-leave",
            notes: "Planned leave"
          }
        );
        continue;
      }

      const checkInHour = status === "half-day" ? 10 : 9;
      const checkInMinute = (index * 7 + daysAgo * 3) % 50;
      const workedMinutes = status === "half-day" ? 250 : 500 + ((index * 13 + daysAgo * 5) % 45);
      const checkIn = toUtcDate(dateIso, checkInHour, checkInMinute);
      const checkOut = new Date(checkIn.getTime() + workedMinutes * 60 * 1000);

      // eslint-disable-next-line no-await-in-loop
      await ensureAttendance(
        { user: user._id, date: toUtcDate(dateIso, 0, 0) },
        {
          user: user._id,
          departmentSnapshot: profile.department,
          date: toUtcDate(dateIso, 0, 0),
          checkIn,
          checkOut,
          workDurationMinutes: workedMinutes,
          status,
          notes: status === "half-day" ? "Half day due to appointment" : "Regular shift"
        }
      );
    }
  }

  const stats = {
    users: await User.countDocuments(),
    employees: await Employee.countDocuments(),
    clients: await Client.countDocuments(),
    teams: await Team.countDocuments(),
    projects: await Project.countDocuments(),
    tasks: await Task.countDocuments(),
    leaves: await Leave.countDocuments(),
    attendance: await Attendance.countDocuments()
  };

  // eslint-disable-next-line no-console
  console.log("Demo data ready");
  // eslint-disable-next-line no-console
  console.log(`Admin login: ${adminEmail}`);
  // eslint-disable-next-line no-console
  console.log(`Employee password for seeded users: ${DEFAULT_EMPLOYEE_PASSWORD}`);
  // eslint-disable-next-line no-console
  console.log(`Today seeded attendance date: ${toIsoDate(new Date())}`);
  // eslint-disable-next-line no-console
  console.log(`Counts => ${JSON.stringify(stats)}`);

  process.exit(0);
};

run().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
