import { z } from "zod";

// Customer types
export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  vehicles: string[]; // vehicle IDs
  createdAt: number;
  totalServices: number;
  totalSpent: number;
  lastServiceDate?: number;
}

// Staff types
export interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "mechanic" | "manager" | "admin";
  specializations: string[];
  hourlyRate: number;
  joinDate: number;
  status: "active" | "inactive" | "on-leave";
}

// Appointment types
export interface Appointment {
  id: string;
  customerId: string;
  vehicleId: string;
  staffId: string;
  serviceType: string;
  scheduledDate: number;
  startTime: string;
  endTime: string;
  status: "scheduled" | "in-progress" | "completed" | "cancelled";
  estimatedCost: number;
  actualCost?: number;
  notes: string;
  createdAt: number;
}

// Performance metrics
export interface StaffPerformance {
  staffId: string;
  totalAppointments: number;
  completedAppointments: number;
  averageRating: number;
  totalRevenue: number;
  averageJobTime: number;
  customerSatisfaction: number;
  specialtyBreakdown: Record<string, number>;
}

// Shop Management Service
export class ShopManagementService {
  private customers: Map<string, Customer> = new Map();
  private staff: Map<string, StaffMember> = new Map();
  private appointments: Map<string, Appointment> = new Map();
  private performance: Map<string, StaffPerformance> = new Map();

  // ============================================
  // CUSTOMER MANAGEMENT
  // ============================================

  addCustomer(customer: Omit<Customer, "id" | "createdAt" | "totalServices" | "totalSpent">): Customer {
    const id = `cust-${Date.now()}`;
    const newCustomer: Customer = {
      ...customer,
      id,
      createdAt: Date.now(),
      totalServices: 0,
      totalSpent: 0,
    };
    this.customers.set(id, newCustomer);
    return newCustomer;
  }

  getCustomer(customerId: string): Customer | null {
    return this.customers.get(customerId) || null;
  }

  updateCustomer(customerId: string, updates: Partial<Customer>): Customer | null {
    const customer = this.customers.get(customerId);
    if (!customer) return null;

    const updated = { ...customer, ...updates };
    this.customers.set(customerId, updated);
    return updated;
  }

  getAllCustomers(): Customer[] {
    return Array.from(this.customers.values());
  }

  // ============================================
  // STAFF MANAGEMENT
  // ============================================

  addStaffMember(staff: Omit<StaffMember, "id" | "joinDate">): StaffMember {
    const id = `staff-${Date.now()}`;
    const newStaff: StaffMember = {
      ...staff,
      id,
      joinDate: Date.now(),
    };
    this.staff.set(id, newStaff);

    // Initialize performance tracking
    this.performance.set(id, {
      staffId: id,
      totalAppointments: 0,
      completedAppointments: 0,
      averageRating: 0,
      totalRevenue: 0,
      averageJobTime: 0,
      customerSatisfaction: 0,
      specialtyBreakdown: {},
    });

    return newStaff;
  }

  getStaffMember(staffId: string): StaffMember | null {
    return this.staff.get(staffId) || null;
  }

  updateStaffMember(staffId: string, updates: Partial<StaffMember>): StaffMember | null {
    const member = this.staff.get(staffId);
    if (!member) return null;

    const updated = { ...member, ...updates };
    this.staff.set(staffId, updated);
    return updated;
  }

  getAllStaff(): StaffMember[] {
    return Array.from(this.staff.values());
  }

  getStaffBySpecialty(specialty: string): StaffMember[] {
    return Array.from(this.staff.values()).filter((s) => s.specializations.includes(specialty));
  }

  // ============================================
  // APPOINTMENT MANAGEMENT
  // ============================================

  scheduleAppointment(appointment: Omit<Appointment, "id" | "createdAt">): Appointment {
    const id = `appt-${Date.now()}`;
    const newAppointment: Appointment = {
      ...appointment,
      id,
      createdAt: Date.now(),
    };
    this.appointments.set(id, newAppointment);

    // Update customer
    const customer = this.customers.get(appointment.customerId);
    if (customer) {
      customer.totalServices++;
      this.customers.set(appointment.customerId, customer);
    }

    // Update staff performance
    const perf = this.performance.get(appointment.staffId);
    if (perf) {
      perf.totalAppointments++;
      this.performance.set(appointment.staffId, perf);
    }

    return newAppointment;
  }

  getAppointment(appointmentId: string): Appointment | null {
    return this.appointments.get(appointmentId) || null;
  }

  updateAppointmentStatus(appointmentId: string, status: Appointment["status"]): Appointment | null {
    const appointment = this.appointments.get(appointmentId);
    if (!appointment) return null;

    const updated = { ...appointment, status };
    this.appointments.set(appointmentId, updated);

    // Update performance if completed
    if (status === "completed") {
      const perf = this.performance.get(appointment.staffId);
      if (perf) {
        perf.completedAppointments++;
        if (appointment.actualCost) {
          perf.totalRevenue += appointment.actualCost;
        }
        this.performance.set(appointment.staffId, perf);
      }

      // Update customer
      const customer = this.customers.get(appointment.customerId);
      if (customer && appointment.actualCost) {
        customer.totalSpent += appointment.actualCost;
        customer.lastServiceDate = Date.now();
        this.customers.set(appointment.customerId, customer);
      }
    }

    return updated;
  }

  getAppointmentsByCustomer(customerId: string): Appointment[] {
    return Array.from(this.appointments.values()).filter((a) => a.customerId === customerId);
  }

  getAppointmentsByStaff(staffId: string): Appointment[] {
    return Array.from(this.appointments.values()).filter((a) => a.staffId === staffId);
  }

  getAppointmentsByDate(date: number): Appointment[] {
    const dayStart = Math.floor(date / 86400000) * 86400000;
    const dayEnd = dayStart + 86400000;
    return Array.from(this.appointments.values()).filter((a) => a.scheduledDate >= dayStart && a.scheduledDate < dayEnd);
  }

  // ============================================
  // PERFORMANCE TRACKING
  // ============================================

  getStaffPerformance(staffId: string): StaffPerformance | null {
    return this.performance.get(staffId) || null;
  }

  getAllStaffPerformance(): StaffPerformance[] {
    return Array.from(this.performance.values());
  }

  updateStaffRating(staffId: string, rating: number): void {
    const perf = this.performance.get(staffId);
    if (!perf) return;

    // Update average rating
    const currentTotal = perf.averageRating * perf.completedAppointments;
    perf.averageRating = (currentTotal + rating) / (perf.completedAppointments + 1);
    this.performance.set(staffId, perf);
  }

  // ============================================
  // ANALYTICS
  // ============================================

  getShopAnalytics(): {
    totalCustomers: number;
    totalStaff: number;
    totalAppointments: number;
    completedAppointments: number;
    totalRevenue: number;
    averageJobCost: number;
    topPerformers: StaffPerformance[];
    appointmentsByStatus: Record<string, number>;
  } {
    const allAppointments = Array.from(this.appointments.values());
    const completedAppointments = allAppointments.filter((a) => a.status === "completed");

    const appointmentsByStatus: Record<string, number> = {
      scheduled: 0,
      "in-progress": 0,
      completed: 0,
      cancelled: 0,
    };

    allAppointments.forEach((a) => {
      appointmentsByStatus[a.status]++;
    });

    const totalRevenue = completedAppointments.reduce((sum, a) => sum + (a.actualCost || 0), 0);
    const averageJobCost = completedAppointments.length > 0 ? totalRevenue / completedAppointments.length : 0;

    const topPerformers = Array.from(this.performance.values())
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 5);

    return {
      totalCustomers: this.customers.size,
      totalStaff: this.staff.size,
      totalAppointments: allAppointments.length,
      completedAppointments: completedAppointments.length,
      totalRevenue,
      averageJobCost,
      topPerformers,
      appointmentsByStatus,
    };
  }

  // ============================================
  // SCHEDULING OPTIMIZATION
  // ============================================

  suggestOptimalStaff(serviceType: string, appointmentDate: number): StaffMember | null {
    const availableStaff = Array.from(this.staff.values()).filter((s) => s.status === "active" && s.specializations.includes(serviceType));

    if (availableStaff.length === 0) return null;

    // Find staff with least appointments on that day
    let optimalStaff = availableStaff[0];
    let minAppointments = this.getAppointmentsByStaff(optimalStaff.id).filter((a) => a.scheduledDate === appointmentDate).length;

    for (const staff of availableStaff) {
      const appointmentCount = this.getAppointmentsByStaff(staff.id).filter((a) => a.scheduledDate === appointmentDate).length;
      if (appointmentCount < minAppointments) {
        optimalStaff = staff;
        minAppointments = appointmentCount;
      }
    }

    return optimalStaff;
  }
}

// Create singleton instance
export const shopManagement = new ShopManagementService();
