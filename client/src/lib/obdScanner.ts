/**
 * OBD-II Bluetooth Scanner Service
 * Handles Web Bluetooth communication with ELM327 adapters
 */

// Web Bluetooth API type definitions
declare global {
  interface Navigator {
    bluetooth?: Bluetooth;
  }

  interface Bluetooth {
    requestDevice(options: RequestDeviceOptions): Promise<BluetoothDevice>;
    getDevices(): Promise<BluetoothDevice[]>;
    getAvailability(): Promise<boolean>;
  }

  interface RequestDeviceOptions {
    filters?: BluetoothFilter[];
    optionalServices?: string[];
  }

  interface BluetoothFilter {
    services?: string[];
    name?: string;
    namePrefix?: string;
    manufacturerId?: number;
    manufacturerData?: BluetoothManufacturerDataFilter[];
    serviceData?: BluetoothServiceDataFilter[];
  }

  interface BluetoothManufacturerDataFilter {
    companyIdentifier: number;
    data?: DataView;
    mask?: DataView;
  }

  interface BluetoothServiceDataFilter {
    service: string;
    data?: DataView;
    mask?: DataView;
  }

  interface BluetoothDevice extends EventTarget {
    id: string;
    name?: string;
    gatt?: BluetoothRemoteGATTServer;
    addEventListener(type: string, listener: EventListener): void;
    removeEventListener(type: string, listener: EventListener): void;
  }

  interface BluetoothRemoteGATTServer {
    device: BluetoothDevice;
    connected: boolean;
    connect(): Promise<BluetoothRemoteGATTServer>;
    disconnect(): void;
    getPrimaryService(service: string | number): Promise<BluetoothRemoteGATTService>;
    getPrimaryServices(service?: string | number): Promise<BluetoothRemoteGATTService[]>;
  }

  interface BluetoothRemoteGATTService extends EventTarget {
    device: BluetoothDevice;
    uuid: string;
    isPrimary: boolean;
    getCharacteristic(characteristic: string | number): Promise<BluetoothRemoteGATTCharacteristic>;
    getCharacteristics(characteristic?: string | number): Promise<BluetoothRemoteGATTCharacteristic[]>;
    getIncludedService(service: string | number): Promise<BluetoothRemoteGATTService>;
    getIncludedServices(service?: string | number): Promise<BluetoothRemoteGATTService[]>;
  }

  interface BluetoothRemoteGATTCharacteristic extends EventTarget {
    service: BluetoothRemoteGATTService;
    uuid: string;
    properties: BluetoothCharacteristicProperties;
    value?: DataView;
    getDescriptor(descriptor: string | number): Promise<BluetoothRemoteGATTDescriptor>;
    getDescriptors(descriptor?: string | number): Promise<BluetoothRemoteGATTDescriptor[]>;
    readValue(): Promise<DataView>;
    writeValue(value: BufferSource): Promise<void>;
    writeValueWithResponse(value: BufferSource): Promise<void>;
    writeValueWithoutResponse(value: BufferSource): Promise<void>;
    startNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
    stopNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
    addEventListener(type: string, listener: EventListener): void;
    removeEventListener(type: string, listener: EventListener): void;
  }

  interface BluetoothCharacteristicProperties {
    broadcast: boolean;
    read: boolean;
    writeWithoutResponse: boolean;
    write: boolean;
    notify: boolean;
    indicate: boolean;
    authenticatedSignedWrites: boolean;
    reliableWrite: boolean;
    writableAuxiliaries: boolean;
  }

  interface BluetoothRemoteGATTDescriptor {
    characteristic: BluetoothRemoteGATTCharacteristic;
    uuid: string;
    value?: DataView;
    readValue(): Promise<DataView>;
    writeValue(value: BufferSource): Promise<void>;
  }
}

export interface OBDDevice {
  id: string;
  name: string;
  device: BluetoothDevice;
}

export interface DTCCode {
  code: string;
  description: string;
  type: 'P' | 'C' | 'B' | 'U'; // Powertrain, Chassis, Body, Network
  severity: 'critical' | 'warning' | 'info';
}

export interface ScanResult {
  dtcCount: number;
  codes: DTCCode[];
  timestamp: number;
  vehicleSpeed?: number;
  engineRPM?: number;
  fuelLevel?: number;
}

// Common DTC descriptions database
const DTC_DATABASE: Record<string, string> = {
  'P0101': 'Mass or Volume Air Flow Circuit Range/Performance Problem',
  'P0102': 'Mass or Volume Air Flow Circuit Low Input',
  'P0103': 'Mass or Volume Air Flow Circuit High Input',
  'P0104': 'Mass or Volume Air Flow Circuit Intermittent',
  'P0105': 'Manifold Absolute Pressure/Barometric Pressure Circuit',
  'P0106': 'Manifold Absolute Pressure/Barometric Pressure Circuit Range/Performance',
  'P0107': 'Manifold Absolute Pressure/Barometric Pressure Circuit Low Input',
  'P0108': 'Manifold Absolute Pressure/Barometric Pressure Circuit High Input',
  'P0109': 'Manifold Absolute Pressure/Barometric Pressure Circuit Intermittent',
  'P0110': 'Intake Air Temperature Circuit',
  'P0111': 'Intake Air Temperature Circuit Range/Performance',
  'P0112': 'Intake Air Temperature Circuit Low Input',
  'P0113': 'Intake Air Temperature Circuit High Input',
  'P0114': 'Intake Air Temperature Circuit Intermittent',
  'P0115': 'Engine Coolant Temperature Circuit',
  'P0116': 'Engine Coolant Temperature Circuit Range/Performance',
  'P0117': 'Engine Coolant Temperature Circuit Low Input',
  'P0118': 'Engine Coolant Temperature Circuit High Input',
  'P0119': 'Engine Coolant Temperature Circuit Intermittent',
  'P0120': 'Throttle/Pedal Position Sensor/Switch Circuit',
  'P0121': 'Throttle/Pedal Position Sensor/Switch Circuit Range/Performance',
  'P0122': 'Throttle/Pedal Position Sensor/Switch Circuit Low Input',
  'P0123': 'Throttle/Pedal Position Sensor/Switch Circuit High Input',
  'P0124': 'Throttle/Pedal Position Sensor/Switch Circuit Intermittent',
  'P0125': 'Excessive Time to Enter Closed Loop Fuel Control',
  'P0126': 'Insufficient Engine Performance',
  'P0128': 'Coolant Thermostat (Coolant Temp Regulating Thermostat) Circuit',
  'P0129': 'Barometric Pressure Out of Range',
  'P0130': 'Oxygen Sensor Circuit',
  'P0131': 'Oxygen Sensor Circuit Low Voltage',
  'P0132': 'Oxygen Sensor Circuit High Voltage',
  'P0133': 'Oxygen Sensor Circuit Slow Response',
  'P0134': 'Oxygen Sensor Circuit No Activity',
  'P0135': 'Oxygen Sensor Heater Circuit',
  'P0136': 'Oxygen Sensor Circuit (Bank 2, Sensor 1)',
  'P0137': 'Oxygen Sensor Circuit Low Voltage (Bank 2, Sensor 1)',
  'P0138': 'Oxygen Sensor Circuit High Voltage (Bank 2, Sensor 1)',
  'P0139': 'Oxygen Sensor Circuit Slow Response (Bank 2, Sensor 1)',
  'P0140': 'Oxygen Sensor Circuit No Activity (Bank 2, Sensor 1)',
  'P0141': 'Oxygen Sensor Heater Circuit (Bank 2, Sensor 1)',
  'P0142': 'Oxygen Sensor Circuit (Bank 1, Sensor 3)',
  'P0143': 'Oxygen Sensor Circuit Low Voltage (Bank 1, Sensor 3)',
  'P0144': 'Oxygen Sensor Circuit High Voltage (Bank 1, Sensor 3)',
  'P0145': 'Oxygen Sensor Circuit Slow Response (Bank 1, Sensor 3)',
  'P0146': 'Oxygen Sensor Circuit No Activity (Bank 1, Sensor 3)',
  'P0147': 'Oxygen Sensor Heater Circuit (Bank 1, Sensor 3)',
  'P0150': 'Fuel Injector Circuit',
  'P0151': 'Fuel Injector Circuit (Cylinder 1)',
  'P0152': 'Fuel Injector Circuit (Cylinder 2)',
  'P0153': 'Fuel Injector Circuit (Cylinder 3)',
  'P0154': 'Fuel Injector Circuit (Cylinder 4)',
  'P0155': 'Fuel Injector Circuit (Cylinder 5)',
  'P0156': 'Fuel Injector Circuit (Cylinder 6)',
  'P0157': 'Fuel Injector Circuit (Cylinder 7)',
  'P0158': 'Fuel Injector Circuit (Cylinder 8)',
  'P0159': 'Fuel Injector Circuit (Cylinder 9)',
  'P0160': 'Fuel Injector Circuit (Cylinder 10)',
  'P0161': 'Fuel Injector Circuit (Cylinder 11)',
  'P0162': 'Fuel Injector Circuit (Cylinder 12)',
  'P0170': 'Fuel Trim System',
  'P0171': 'System Too Lean',
  'P0172': 'System Too Rich',
  'P0173': 'Fuel Trim System (Bank 2)',
  'P0174': 'System Too Lean (Bank 2)',
  'P0175': 'System Too Rich (Bank 2)',
  'P0176': 'Fuel Composition Sensor Circuit',
  'P0177': 'Fuel Composition Sensor Circuit Range/Performance',
  'P0178': 'Fuel Composition Sensor Circuit Low Input',
  'P0179': 'Fuel Composition Sensor Circuit High Input',
  'P0180': 'Fuel Temperature Sensor Circuit',
  'P0181': 'Fuel Temperature Sensor Circuit Range/Performance',
  'P0182': 'Fuel Temperature Sensor Circuit Low Input',
  'P0183': 'Fuel Temperature Sensor Circuit High Input',
  'P0184': 'Fuel Temperature Sensor Circuit Intermittent',
  'P0190': 'Fuel Rail Pressure Sensor Circuit',
  'P0191': 'Fuel Rail Pressure Sensor Circuit Range/Performance',
  'P0192': 'Fuel Rail Pressure Sensor Circuit Low Input',
  'P0193': 'Fuel Rail Pressure Sensor Circuit High Input',
  'P0194': 'Fuel Rail Pressure Sensor Circuit Intermittent',
  'P0195': 'Engine Oil Temperature Sensor Circuit',
  'P0196': 'Engine Oil Temperature Sensor Circuit Range/Performance',
  'P0197': 'Engine Oil Temperature Sensor Circuit Low',
  'P0198': 'Engine Oil Temperature Sensor Circuit High',
  'P0199': 'Engine Oil Temperature Sensor Circuit Intermittent',
  'P0200': 'Injector Circuit',
  'P0201': 'Injector Circuit Cylinder 1',
  'P0202': 'Injector Circuit Cylinder 2',
  'P0203': 'Injector Circuit Cylinder 3',
  'P0204': 'Injector Circuit Cylinder 4',
  'P0205': 'Injector Circuit Cylinder 5',
  'P0206': 'Injector Circuit Cylinder 6',
  'P0207': 'Injector Circuit Cylinder 7',
  'P0208': 'Injector Circuit Cylinder 8',
  'P0209': 'Injector Circuit Cylinder 9',
  'P0210': 'Injector Circuit Cylinder 10',
  'P0211': 'Injector Circuit Cylinder 11',
  'P0212': 'Injector Circuit Cylinder 12',
  'P0213': 'Cold Start Injector 1 Circuit',
  'P0214': 'Cold Start Injector 2 Circuit',
  'P0215': 'Engine Shutoff Solenoid Circuit',
  'P0216': 'Injection Timing Control Circuit',
  'P0217': 'Engine Over Temperature Condition',
  'P0218': 'Transmission Over Temperature Condition',
  'P0219': 'Engine Over Speed Condition',
  'P0220': 'Throttle/Pedal Position Sensor/Switch B Circuit',
  'P0300': 'Random/Multiple Cylinder Misfire Detected',
  'P0301': 'Cylinder 1 Misfire Detected',
  'P0302': 'Cylinder 2 Misfire Detected',
  'P0303': 'Cylinder 3 Misfire Detected',
  'P0304': 'Cylinder 4 Misfire Detected',
  'P0305': 'Cylinder 5 Misfire Detected',
  'P0306': 'Cylinder 6 Misfire Detected',
  'P0307': 'Cylinder 7 Misfire Detected',
  'P0308': 'Cylinder 8 Misfire Detected',
  'P0309': 'Cylinder 9 Misfire Detected',
  'P0310': 'Cylinder 10 Misfire Detected',
  'P0311': 'Cylinder 11 Misfire Detected',
  'P0312': 'Cylinder 12 Misfire Detected',
  'P0320': 'Ignition/Distributor Engine Speed Input Circuit',
  'P0321': 'Ignition/Distributor Engine Speed Input Circuit Range/Performance',
  'P0322': 'Ignition/Distributor Engine Speed Input Circuit Low Input',
  'P0323': 'Ignition/Distributor Engine Speed Input Circuit High Input',
  'P0324': 'Ignition/Distributor Engine Speed Input Circuit Intermittent',
  'P0325': 'Knock Sensor 1 Circuit',
  'P0326': 'Knock Sensor 1 Circuit Range/Performance',
  'P0327': 'Knock Sensor 1 Circuit Low Input',
  'P0328': 'Knock Sensor 1 Circuit High Input',
  'P0329': 'Knock Sensor 1 Circuit Intermittent',
  'P0330': 'Knock Sensor 2 Circuit',
  'P0331': 'Knock Sensor 2 Circuit Range/Performance',
  'P0332': 'Knock Sensor 2 Circuit Low Input',
  'P0333': 'Knock Sensor 2 Circuit High Input',
  'P0334': 'Knock Sensor 2 Circuit Intermittent',
  'P0335': 'Crankshaft Position Sensor A Circuit',
  'P0336': 'Crankshaft Position Sensor A Circuit Range/Performance',
  'P0337': 'Crankshaft Position Sensor A Circuit Low Input',
  'P0338': 'Crankshaft Position Sensor A Circuit High Input',
  'P0339': 'Crankshaft Position Sensor A Circuit Intermittent',
  'P0340': 'Camshaft Position Sensor Circuit',
  'P0341': 'Camshaft Position Sensor Circuit Range/Performance',
  'P0342': 'Camshaft Position Sensor Circuit Low Input',
  'P0343': 'Camshaft Position Sensor Circuit High Input',
  'P0344': 'Camshaft Position Sensor Circuit Intermittent',
  'P0350': 'Ignition Coil Primary/Secondary Circuit',
  'P0351': 'Ignition Coil A Primary/Secondary Circuit',
  'P0352': 'Ignition Coil B Primary/Secondary Circuit',
  'P0353': 'Ignition Coil C Primary/Secondary Circuit',
  'P0354': 'Ignition Coil D Primary/Secondary Circuit',
  'P0355': 'Ignition Coil E Primary/Secondary Circuit',
  'P0356': 'Ignition Coil F Primary/Secondary Circuit',
  'P0357': 'Ignition Coil G Primary/Secondary Circuit',
  'P0358': 'Ignition Coil H Primary/Secondary Circuit',
  'P0359': 'Ignition Coil I Primary/Secondary Circuit',
  'P0360': 'Ignition Coil J Primary/Secondary Circuit',
  'P0361': 'Ignition Coil K Primary/Secondary Circuit',
  'P0362': 'Ignition Coil L Primary/Secondary Circuit',
  'P0370': 'Timing Reference High Resolution Signal A',
  'P0371': 'Timing Reference High Resolution Signal A Too Many Pulses',
  'P0372': 'Timing Reference High Resolution Signal A Too Few Pulses',
  'P0373': 'Timing Reference High Resolution Signal A Intermittent/Erratic Pulses',
  'P0374': 'Timing Reference High Resolution Signal A No Pulses',
  'P0375': 'Timing Reference High Resolution Signal B',
  'P0376': 'Timing Reference High Resolution Signal B Too Many Pulses',
  'P0377': 'Timing Reference High Resolution Signal B Too Few Pulses',
  'P0378': 'Timing Reference High Resolution Signal B Intermittent/Erratic Pulses',
  'P0379': 'Timing Reference High Resolution Signal B No Pulses',
  'P0380': 'Glow Plug/Heater Circuit',
  'P0381': 'Glow Plug/Heater Indicator Circuit',
  'P0382': 'Glow Plug/Heater Control Module to Glow Plug/Heater Feedback Circuit',
  'P0385': 'Crankshaft Position Sensor B Circuit',
  'P0386': 'Crankshaft Position Sensor B Circuit Range/Performance',
  'P0387': 'Crankshaft Position Sensor B Circuit Low Input',
  'P0388': 'Crankshaft Position Sensor B Circuit High Input',
  'P0389': 'Crankshaft Position Sensor B Circuit Intermittent',
  'P0400': 'Exhaust Gas Recirculation Flow',
  'P0401': 'Exhaust Gas Recirculation Flow Insufficient Detected',
  'P0402': 'Exhaust Gas Recirculation Flow Excessive Detected',
  'P0403': 'Exhaust Gas Recirculation Control Circuit',
  'P0404': 'Exhaust Gas Recirculation Control Circuit Range/Performance',
  'P0405': 'Exhaust Gas Recirculation Sensor A Circuit Low',
  'P0406': 'Exhaust Gas Recirculation Sensor A Circuit High',
  'P0407': 'Exhaust Gas Recirculation Sensor B Circuit Low',
  'P0408': 'Exhaust Gas Recirculation Sensor B Circuit High',
  'P0409': 'Exhaust Gas Recirculation Sensor A Circuit Intermittent',
  'P0410': 'Secondary Air Injection System',
  'P0411': 'Secondary Air Injection System Incorrect Flow Detected',
  'P0412': 'Secondary Air Injection System Switching Valve A Circuit',
  'P0413': 'Secondary Air Injection System Switching Valve A Circuit Open',
  'P0414': 'Secondary Air Injection System Switching Valve A Circuit Shorted',
  'P0415': 'Secondary Air Injection System Switching Valve B Circuit',
  'P0416': 'Secondary Air Injection System Switching Valve B Circuit Open',
  'P0417': 'Secondary Air Injection System Switching Valve B Circuit Shorted',
  'P0418': 'Secondary Air Injection System Relay A Circuit',
  'P0419': 'Secondary Air Injection System Relay B Circuit',
  'P0420': 'Catalyst System Efficiency Below Threshold',
  'P0421': 'Warm Up Catalyst System Efficiency Below Threshold',
  'P0422': 'Main Catalyst System Efficiency Below Threshold',
  'P0423': 'Heated Catalyst System Efficiency Below Threshold',
  'P0424': 'Catalyst Temperature Below Threshold',
  'P0430': 'Catalyst System Efficiency Below Threshold (Bank 2)',
  'P0431': 'Warm Up Catalyst System Efficiency Below Threshold (Bank 2)',
  'P0432': 'Main Catalyst System Efficiency Below Threshold (Bank 2)',
  'P0433': 'Heated Catalyst System Efficiency Below Threshold (Bank 2)',
  'P0434': 'Catalyst Temperature Below Threshold (Bank 2)',
  'P0440': 'Evaporative Emission Control System',
  'P0441': 'Evaporative Emission Control System Incorrect Purge Flow',
  'P0442': 'Evaporative Emission Control System Leak Detected (Small)',
  'P0443': 'Evaporative Emission Control System Purge Control Valve Circuit',
  'P0444': 'Evaporative Emission Control System Purge Control Valve Circuit Open',
  'P0445': 'Evaporative Emission Control System Purge Control Valve Circuit Shorted',
  'P0446': 'Evaporative Emission Control System Vent Control Circuit',
  'P0447': 'Evaporative Emission Control System Vent Control Circuit Open',
  'P0448': 'Evaporative Emission Control System Vent Control Circuit Shorted',
  'P0449': 'Evaporative Emission Control System Vent Valve/Solenoid Circuit',
  'P0450': 'Evaporative Emission Control System Pressure Sensor',
  'P0451': 'Evaporative Emission Control System Pressure Sensor Range/Performance',
  'P0452': 'Evaporative Emission Control System Pressure Sensor Low Input',
  'P0453': 'Evaporative Emission Control System Pressure Sensor High Input',
  'P0454': 'Evaporative Emission Control System Pressure Sensor Intermittent',
  'P0455': 'Evaporative Emission Control System Leak Detected (Gross)',
  'P0456': 'Evaporative Emission Control System Leak Detected (Very Small)',
  'P0457': 'Evaporative Emission Control System Leak Detected (Fuel Cap Loose/Off)',
  'P0458': 'Evaporative Emission Control System Purge Control Valve Circuit Low',
  'P0459': 'Evaporative Emission Control System Purge Control Valve Circuit High',
  'P0460': 'Fuel Level Sensor Circuit',
  'P0461': 'Fuel Level Sensor Circuit Range/Performance',
  'P0462': 'Fuel Level Sensor Circuit Low Input',
  'P0463': 'Fuel Level Sensor Circuit High Input',
  'P0464': 'Fuel Level Sensor Circuit Intermittent',
  'P0465': 'Purge Flow Sensor Circuit',
  'P0466': 'Purge Flow Sensor Circuit Range/Performance',
  'P0467': 'Purge Flow Sensor Circuit Low Input',
  'P0468': 'Purge Flow Sensor Circuit High Input',
  'P0469': 'Purge Flow Sensor Circuit Intermittent',
  'P0470': 'Exhaust Pressure Sensor Circuit',
  'P0471': 'Exhaust Pressure Sensor Circuit Range/Performance',
  'P0472': 'Exhaust Pressure Sensor Circuit Low',
  'P0473': 'Exhaust Pressure Sensor Circuit High',
  'P0474': 'Exhaust Pressure Sensor Circuit Intermittent',
  'P0475': 'Exhaust Pressure Control Valve',
  'P0476': 'Exhaust Pressure Control Valve Range/Performance',
  'P0477': 'Exhaust Pressure Control Valve Low',
  'P0478': 'Exhaust Pressure Control Valve High',
  'P0479': 'Exhaust Pressure Control Valve Intermittent',
  'P0480': 'Fan 1 Control Circuit',
  'P0481': 'Fan 2 Control Circuit',
  'P0482': 'Fan 3 Control Circuit',
  'P0483': 'Fan Rationality Check',
  'P0484': 'Cooling Fan Over Current',
  'P0485': 'Cooling Fan Power/Ground Circuit',
  'P0500': 'Vehicle Speed Sensor Malfunction',
  'P0501': 'Vehicle Speed Sensor Range/Performance',
  'P0502': 'Vehicle Speed Sensor Circuit Low Input',
  'P0503': 'Vehicle Speed Sensor Intermittent/Erratic',
  'P0504': 'Brake Switch A/B Correlation',
  'P0505': 'Idle Air Control System Malfunction',
  'P0506': 'Idle Air Control System RPM Lower Than Expected',
  'P0507': 'Idle Air Control System RPM Higher Than Expected',
  'P0508': 'Idle Air Control System Low',
  'P0509': 'Idle Air Control System High',
  'P0510': 'Closed Throttle Position Switch',
  'P0511': 'Idle Air Control System Circuit',
  'P0512': 'Starter Request Circuit',
  'P0513': 'Incorrect Immobilizer Key',
  'P0514': 'Battery Voltage Out of Range',
  'P0515': 'Battery Voltage Out of Range',
  'P0516': 'Battery Voltage Out of Range',
  'P0517': 'Engine Over Speed Protection Activated',
  'P0518': 'Idle Air Control System Circuit Intermittent',
  'P0519': 'Idle Air Control System Performance',
  'P0520': 'Engine Oil Pressure Sensor/Switch Circuit',
  'P0521': 'Engine Oil Pressure Sensor/Switch Circuit Range/Performance',
  'P0522': 'Engine Oil Pressure Sensor/Switch Circuit Low Voltage',
  'P0523': 'Engine Oil Pressure Sensor/Switch Circuit High Voltage',
  'P0524': 'Engine Oil Level Too Low',
  'P0525': 'Idle Air Control System Fault',
  'P0526': 'Engine Coolant Fan Speed Sensor Circuit',
  'P0527': 'Engine Coolant Fan Speed Sensor Circuit Range/Performance',
  'P0528': 'Engine Coolant Fan Speed Sensor Circuit No Signal',
  'P0529': 'Engine Coolant Fan Speed Sensor Circuit Intermittent',
  'P0530': 'A/C Refrigerant Pressure Sensor Circuit',
  'P0531': 'A/C Refrigerant Pressure Sensor Circuit Range/Performance',
  'P0532': 'A/C Refrigerant Pressure Sensor Circuit Low Input',
  'P0533': 'A/C Refrigerant Pressure Sensor Circuit High Input',
  'P0534': 'A/C Refrigerant Pressure Sensor Circuit Intermittent',
  'P0535': 'A/C Evaporator Temperature Sensor Circuit',
  'P0536': 'A/C Evaporator Temperature Sensor Circuit Range/Performance',
  'P0537': 'A/C Evaporator Temperature Sensor Circuit Low Input',
  'P0538': 'A/C Evaporator Temperature Sensor Circuit High Input',
  'P0539': 'A/C Evaporator Temperature Sensor Circuit Intermittent',
  'P0540': 'Intake Air Heater Circuit',
  'P0541': 'Intake Air Heater Circuit Low',
  'P0542': 'Intake Air Heater Circuit High',
  'P0543': 'Intake Air Heater Circuit Open',
  'P0544': 'Exhaust Gas Temperature Sensor Circuit',
  'P0545': 'Exhaust Gas Temperature Sensor Circuit Low',
  'P0546': 'Exhaust Gas Temperature Sensor Circuit High',
  'P0547': 'Exhaust Gas Temperature Sensor Circuit Intermittent',
  'P0548': 'Exhaust Gas Temperature Sensor Circuit Shorted to Battery',
  'P0549': 'Speed Control Solenoid A Circuit',
  'P0550': 'Power Steering Pressure Sensor Circuit',
  'P0551': 'Power Steering Pressure Sensor Circuit Range/Performance',
  'P0552': 'Power Steering Pressure Sensor Circuit Low Input',
  'P0553': 'Power Steering Pressure Sensor Circuit High Input',
  'P0554': 'Power Steering Pressure Sensor Circuit Intermittent',
  'P0555': 'Power Steering System Flow Too Low',
  'P0556': 'Power Steering System Flow Too High',
  'P0557': 'Engine Brake Output On Demand Excessive',
  'P0558': 'Idle Air Control System Performance',
  'P0559': 'Engine Speed Control Malfunction',
  'P0560': 'System Voltage Malfunction',
  'P0561': 'System Voltage Unstable',
  'P0562': 'System Voltage Low',
  'P0563': 'System Voltage High',
  'P0564': 'Cruise Control Multi-Function Input A Circuit',
  'P0565': 'Cruise Control On/Off Switch',
  'P0566': 'Cruise Control Resume/Accel Switch',
  'P0567': 'Cruise Control Coast/Decel Switch',
  'P0568': 'Cruise Control Set/Resume Switch',
  'P0569': 'Cruise Control Clutch Switch Input Circuit',
  'P0570': 'Cruise Control Brake Switch Input Circuit',
  'P0571': 'Cruise Control/Brake Interlock Switch',
  'P0572': 'Cruise Control/Brake Switch Low',
  'P0573': 'Cruise Control/Brake Switch High',
  'P0574': 'Engine Speed Control Output Circuit',
  'P0575': 'Speed Control Switch Circuit',
  'P0576': 'Speed Control Switch Circuit Low',
  'P0577': 'Speed Control Switch Circuit High',
  'P0578': 'Cruise Control Multi-Function Input B Circuit',
  'P0579': 'Cruise Control Multi-Function Input A Circuit Low',
  'P0580': 'Cruise Control Multi-Function Input A Circuit High',
  'P0581': 'Cruise Control Multi-Function Input B Circuit Low',
  'P0582': 'Cruise Control Multi-Function Input B Circuit High',
  'P0583': 'Cruise Control Multi-Function Input C Circuit',
  'P0584': 'Cruise Control Multi-Function Input C Circuit Low',
  'P0585': 'Cruise Control Multi-Function Input C Circuit High',
  'P0586': 'Cruise Control Multi-Function Input D Circuit',
  'P0587': 'Cruise Control Multi-Function Input D Circuit Low',
  'P0588': 'Cruise Control Multi-Function Input D Circuit High',
  'P0589': 'Cruise Control Multi-Function Input E Circuit',
  'P0590': 'Cruise Control Multi-Function Input E Circuit Low',
  'P0591': 'Cruise Control Multi-Function Input E Circuit High',
  'P0592': 'Cruise Control Multi-Function Input F Circuit',
  'P0593': 'Cruise Control Multi-Function Input F Circuit Low',
  'P0594': 'Cruise Control Multi-Function Input F Circuit High',
  'P0595': 'Idle Air Control System Overspeed Control',
  'P0596': 'Idle Air Control System Hunting',
  'P0597': 'Idle Air Control System Performance',
  'P0598': 'Idle Air Control System Low',
  'P0599': 'Idle Air Control System High',
  'P0600': 'Serial Communication Link Malfunction',
  'P0601': 'Internal Control Module Memory Check Sum Error',
  'P0602': 'Control Module Programming Error',
  'P0603': 'Internal Control Module Keep Alive Memory Error',
  'P0604': 'Internal Control Module Random Access Memory Error',
  'P0605': 'Internal Control Module Read Only Memory Error',
  'P0606': 'PCM/ECM/ECU Processor Fault',
  'P0607': 'Control Module Performance',
  'P0608': 'Control Module VSS Output A',
  'P0609': 'Control Module VSS Output B',
  'P0610': 'Control Module Make/Model Not Programmable',
  'P0611': 'MIL Control Circuit',
  'P0612': 'EEPROM Not Programmable',
  'P0613': 'Internal Transmission Control Module (TCM) Fault',
  'P0614': 'TCM Not Programmed',
  'P0615': 'Starter Motor Relay Circuit',
  'P0616': 'Starter Motor Relay Circuit Low',
  'P0617': 'Starter Motor Relay Circuit High',
  'P0618': 'Alternative Fuel Control Module Power Relay Circuit',
  'P0619': 'Engine Start Enable Circuit',
  'P0620': 'Generator Control Circuit',
  'P0621': 'Generator Lamp L Terminal Circuit',
  'P0622': 'Generator Field Terminal Circuit',
  'P0623': 'Generator Load Input Circuit',
  'P0624': 'Fuel Cap Door Control Circuit',
  'P0625': 'Generator Voltage Low',
  'P0626': 'Generator Voltage High',
  'P0627': 'Fuel Pump Relay Control Circuit',
  'P0628': 'Fuel Pump Relay Control Circuit Low',
  'P0629': 'Fuel Pump Relay Control Circuit High',
  'P0630': 'VIN Not Programmable',
  'P0631': 'VIN Not Read',
  'P0632': 'Odometer Not Programmable',
  'P0633': 'Immobilizer Key Not Programmed',
  'P0634': 'PCM/ECM/ECU Not Programmed',
  'P0635': 'Power Steering Control Circuit',
  'P0636': 'Power Steering Control Circuit Low',
  'P0637': 'Power Steering Control Circuit High',
  'P0638': 'Throttle Actuator Power A Circuit',
  'P0639': 'Throttle Actuator Power B Circuit',
  'P0640': 'Intake Air Heater Relay Circuit',
  'P0641': 'Sensor Reference Voltage A Circuit',
  'P0642': 'Sensor Reference Voltage A Circuit Low',
  'P0643': 'Sensor Reference Voltage A Circuit High',
  'P0644': 'Driver Display Serial Communication Circuit',
  'P0645': 'A/C Clutch Relay Control Circuit',
  'P0646': 'A/C Clutch Relay Control Circuit Low',
  'P0647': 'A/C Clutch Relay Control Circuit High',
  'P0648': 'Immobilizer Fuel Pump Relay Control Circuit',
  'P0649': 'Speed Control Unable to Hold Speed',
  'P0650': 'MIL (Check Engine Light) Control Circuit',
  'P0651': 'Sensor Reference Voltage B Circuit',
  'P0652': 'Sensor Reference Voltage B Circuit Low',
  'P0653': 'Sensor Reference Voltage B Circuit High',
  'P0654': 'Engine RPM Output Circuit',
  'P0655': 'Engine Load Output Circuit',
  'P0656': 'Fuel Level Output Circuit',
  'P0657': 'Actuator Supply Voltage Circuit Open',
  'P0658': 'Actuator Supply Voltage Circuit Low',
  'P0659': 'Actuator Supply Voltage Circuit High',
  'P0660': 'Intake Manifold Tuning Valve Control Circuit',
  'P0661': 'Intake Manifold Tuning Valve Control Circuit Low',
  'P0662': 'Intake Manifold Tuning Valve Control Circuit High',
  'P0663': 'Intake Manifold Tuning Valve Control Circuit Intermittent',
  'P0664': 'Intake Manifold Tuning Valve Position Sensor Circuit',
  'P0665': 'Intake Manifold Tuning Valve Position Sensor Circuit Range/Performance',
  'P0666': 'Intake Manifold Tuning Valve Position Sensor Circuit Low Input',
  'P0667': 'Intake Manifold Tuning Valve Position Sensor Circuit High Input',
  'P0668': 'Intake Manifold Tuning Valve Position Sensor Circuit Intermittent',
  'P0669': 'Intake Manifold Tuning Valve Position Sensor Circuit Intermittent',
  'P0670': 'Engine Coolant Temperature Sensor 2 Circuit',
  'P0671': 'Engine Coolant Temperature Sensor 2 Circuit Range/Performance',
  'P0672': 'Engine Coolant Temperature Sensor 2 Circuit Low Input',
  'P0673': 'Engine Coolant Temperature Sensor 2 Circuit High Input',
  'P0674': 'Engine Coolant Temperature Sensor 2 Circuit Intermittent',
  'P0675': 'Engine Coolant Temperature Sensor 3 Circuit',
  'P0676': 'Engine Coolant Temperature Sensor 3 Circuit Range/Performance',
  'P0677': 'Engine Coolant Temperature Sensor 3 Circuit Low Input',
  'P0678': 'Engine Coolant Temperature Sensor 3 Circuit High Input',
  'P0679': 'Engine Coolant Temperature Sensor 3 Circuit Intermittent',
  'P0680': 'Glow Plug Lamp Control Circuit',
  'P0681': 'Red Stop Lamp Control Circuit',
  'P0682': 'Malfunction Indicator Lamp Control Circuit',
  'P0683': 'Engine Load Calculation Cross Check',
  'P0684': 'Starter Enable Control Circuit',
  'P0685': 'Engine Control Power Relay De-Energized Too Early',
  'P0686': 'Engine Control Power Relay De-Energized Too Late',
  'P0687': 'Engine Control Power Relay Control Circuit Low',
  'P0688': 'Engine Control Power Relay Control Circuit High',
  'P0689': 'Engine Control Power Relay Sense Circuit Low',
  'P0690': 'Engine Control Power Relay Sense Circuit High',
  'P0691': 'Cooling Fan 1 Control Circuit Low',
  'P0692': 'Cooling Fan 1 Control Circuit High',
  'P0693': 'Cooling Fan 2 Control Circuit Low',
  'P0694': 'Cooling Fan 2 Control Circuit High',
  'P0695': 'Cooling Fan 3 Control Circuit Low',
  'P0696': 'Cooling Fan 3 Control Circuit High',
  'P0697': 'Sensor Reference Voltage C Circuit',
  'P0698': 'Sensor Reference Voltage C Circuit Low',
  'P0699': 'Sensor Reference Voltage C Circuit High',
  'P0700': 'Transmission Control System Malfunction',
  'P0701': 'Transmission Control System Range/Performance',
  'P0702': 'Transmission Control System Electrical',
  'P0703': 'Brake Switch Input Circuit',
  'P0704': 'Clutch Switch Input Circuit',
  'P0705': 'Transmission Range Sensor Circuit',
  'P0706': 'Transmission Range Sensor Circuit Range/Performance',
  'P0707': 'Transmission Range Sensor Circuit Low Input',
  'P0708': 'Transmission Range Sensor Circuit High Input',
  'P0709': 'Transmission Range Sensor Circuit Intermittent',
  'P0710': 'Transmission Fluid Temperature Sensor Circuit',
  'P0711': 'Transmission Fluid Temperature Sensor Circuit Range/Performance',
  'P0712': 'Transmission Fluid Temperature Sensor Circuit Low Input',
  'P0713': 'Transmission Fluid Temperature Sensor Circuit High Input',
  'P0714': 'Transmission Fluid Temperature Sensor Circuit Intermittent',
  'P0715': 'Input/Turbine Speed Sensor Circuit',
  'P0716': 'Input/Turbine Speed Sensor Circuit Range/Performance',
  'P0717': 'Input/Turbine Speed Sensor Circuit No Signal',
  'P0718': 'Input/Turbine Speed Sensor Circuit Intermittent',
  'P0719': 'Brake Switch B Circuit',
  'P0720': 'Output Speed Sensor Circuit',
  'P0721': 'Output Speed Sensor Circuit Range/Performance',
  'P0722': 'Output Speed Sensor Circuit No Signal',
  'P0723': 'Output Speed Sensor Circuit Intermittent',
  'P0724': 'Output Speed Sensor Circuit Shorted to Battery',
  'P0725': 'Engine Speed Input Circuit',
  'P0726': 'Engine Speed Input Circuit Range/Performance',
  'P0727': 'Engine Speed Input Circuit No Signal',
  'P0728': 'Engine Speed Input Circuit Intermittent',
  'P0729': 'Engine Speed Input Circuit Erratic',
  'P0730': 'Automatic Transmission Range Disengagement',
  'P0731': 'Gear 1 Incorrect Ratio',
  'P0732': 'Gear 2 Incorrect Ratio',
  'P0733': 'Gear 3 Incorrect Ratio',
  'P0734': 'Gear 4 Incorrect Ratio',
  'P0735': 'Gear 5 Incorrect Ratio',
  'P0736': 'Reverse Incorrect Ratio',
  'P0737': 'Torque Converter Clutch Circuit',
  'P0738': 'Torque Converter Clutch Circuit Low',
  'P0739': 'Torque Converter Clutch Circuit High',
  'P0740': 'Torque Converter Clutch Circuit',
  'P0741': 'Torque Converter Clutch Circuit Performance or Stuck Off',
  'P0742': 'Torque Converter Clutch Circuit Stuck On',
  'P0743': 'Torque Converter Clutch Circuit Electrical',
  'P0744': 'Torque Converter Clutch Circuit Intermittent',
  'P0745': 'Pressure Control Solenoid A',
  'P0746': 'Pressure Control Solenoid A Performance or Stuck Off',
  'P0747': 'Pressure Control Solenoid A Stuck On',
  'P0748': 'Pressure Control Solenoid A Electrical',
  'P0749': 'Pressure Control Solenoid A Intermittent',
  'P0750': 'Shift Solenoid A',
  'P0751': 'Shift Solenoid A Performance or Stuck Off',
  'P0752': 'Shift Solenoid A Stuck On',
  'P0753': 'Shift Solenoid A Electrical',
  'P0754': 'Shift Solenoid A Intermittent',
  'P0755': 'Shift Solenoid B',
  'P0756': 'Shift Solenoid B Performance or Stuck Off',
  'P0757': 'Shift Solenoid B Stuck On',
  'P0758': 'Shift Solenoid B Electrical',
  'P0759': 'Shift Solenoid B Intermittent',
  'P0760': 'Shift Solenoid C',
  'P0761': 'Shift Solenoid C Performance or Stuck Off',
  'P0762': 'Shift Solenoid C Stuck On',
  'P0763': 'Shift Solenoid C Electrical',
  'P0764': 'Shift Solenoid C Intermittent',
  'P0765': 'Shift Solenoid D',
  'P0766': 'Shift Solenoid D Performance or Stuck Off',
  'P0767': 'Shift Solenoid D Stuck On',
  'P0768': 'Shift Solenoid D Electrical',
  'P0769': 'Shift Solenoid D Intermittent',
  'P0770': 'Shift Solenoid E',
  'P0771': 'Shift Solenoid E Performance or Stuck Off',
  'P0772': 'Shift Solenoid E Stuck On',
  'P0773': 'Shift Solenoid E Electrical',
  'P0774': 'Shift Solenoid E Intermittent',
  'P0775': 'Pressure Control Solenoid B',
  'P0776': 'Pressure Control Solenoid B Performance or Stuck Off',
  'P0777': 'Pressure Control Solenoid B Stuck On',
  'P0778': 'Pressure Control Solenoid B Electrical',
  'P0779': 'Pressure Control Solenoid B Intermittent',
  'P0780': 'Shift Control System',
  'P0781': 'Shift Control System 1-2',
  'P0782': 'Shift Control System 2-3',
  'P0783': 'Shift Control System 3-4',
  'P0784': 'Shift Control System 4-5',
  'P0785': 'Shift Solenoid F',
  'P0786': 'Shift Solenoid F Performance or Stuck Off',
  'P0787': 'Shift Solenoid F Stuck On',
  'P0788': 'Shift Solenoid F Electrical',
  'P0789': 'Shift Solenoid F Intermittent',
  'P0790': 'Normal/Adaptive Shift Logic',
  'P0791': 'Intermediate Shaft Speed Sensor Circuit',
  'P0792': 'Intermediate Shaft Speed Sensor Circuit No Signal',
  'P0793': 'Intermediate Shaft Speed Sensor Circuit Intermittent',
  'P0794': 'Intermediate Shaft Speed Sensor Circuit Erratic',
  'P0795': 'Pressure Control Solenoid C',
  'P0796': 'Pressure Control Solenoid C Performance or Stuck Off',
  'P0797': 'Pressure Control Solenoid C Stuck On',
  'P0798': 'Pressure Control Solenoid C Electrical',
  'P0799': 'Pressure Control Solenoid C Intermittent',
  'P0800': 'Up and Down Shift Switch Input Circuit',
  'P0801': 'Reverse Inhibit Control Circuit',
  'P0802': 'Learn Not Allowed',
  'P0803': 'Torque Management Request Input Signal',
  'P0804': 'Clutch Adaptive Learning Not Complete',
  'P0805': 'Clutch Position Learning',
  'P0806': 'Clutch Adaptive Learning at Limit',
  'P0807': 'Modulation Disengagement Switch Circuit',
  'P0808': 'Engine to Transmission Control Module Communication',
  'P0809': 'Request Input Out of Range',
  'P0810': 'Transmission Control Module Relay Output',
  'P0811': 'Engine to Transmission Control Module Communication',
  'P0812': 'Reverse Input Circuit',
  'P0813': 'Shift Solenoid A/B Correlation',
  'P0814': 'Transmission Range Display Circuit',
  'P0815': 'Upshift Switch Input Circuit',
  'P0816': 'Downshift Switch Input Circuit',
  'P0817': 'Engine Braking Control Circuit',
  'P0818': 'Engine Braking Control Relay Circuit',
  'P0819': 'Shift Pattern Select Switch Circuit',
  'P0820': 'Transmission Control Module Communication Circuit',
  'P0821': 'Gear Shift Switch Circuit',
  'P0822': 'Engine Braking Control Solenoid Circuit',
  'P0823': 'Fluid Level Low Switch Input',
  'P0824': 'Engine Braking Control Output Circuit',
  'P0825': 'Shift Button Switch Circuit',
  'P0826': 'Up and Down Shift Switch Input Circuit',
  'P0827': 'Transmission Range Sensor B Circuit',
  'P0828': 'Transmission Range Sensor B Circuit Low',
  'P0829': 'Transmission Range Sensor B Circuit High',
  'P0830': 'Clutch Pedal Switch A Circuit',
  'P0831': 'Clutch Pedal Switch A Circuit Low',
  'P0832': 'Clutch Pedal Switch A Circuit High',
  'P0833': 'Clutch Pedal Switch B Circuit',
  'P0834': 'Clutch Pedal Switch B Circuit Low',
  'P0835': 'Clutch Pedal Switch B Circuit High',
  'P0836': 'Gear Shift Switch Circuit',
  'P0837': 'Gear Shift Switch Circuit Low',
  'P0838': 'Gear Shift Switch Circuit High',
  'P0839': 'Transmission Fluid Cooler Flow Low',
  'P0840': 'Transmission Fluid Level Low',
  'P0841': 'Transmission Fluid Level Low',
  'P0842': 'Transmission Fluid Level High',
  'P0843': 'Transmission Fluid Level Sensor Circuit',
  'P0844': 'Transmission Fluid Level Sensor Circuit Low',
  'P0845': 'Transmission Fluid Level Sensor Circuit High',
  'P0846': 'Transmission Fluid Level Sensor Circuit Intermittent',
  'P0847': 'Pressure Control Solenoid D',
  'P0848': 'Pressure Control Solenoid D Performance or Stuck Off',
  'P0849': 'Pressure Control Solenoid D Stuck On',
  'P0850': 'Park/Neutral Switch Input Circuit',
  'P0851': 'Park/Neutral Switch Input Circuit Low',
  'P0852': 'Park/Neutral Switch Input Circuit High',
  'P0853': 'Park/Neutral Switch Input Circuit Intermittent',
  'P0854': 'Engine to Transmission Control Module Communication',
  'P0855': 'Transmission Control Module Relay Output',
  'P0856': 'Transmission Control Module Relay Output Low',
  'P0857': 'Transmission Control Module Relay Output High',
  'P0858': 'Engine to Transmission Control Module Communication',
  'P0859': 'Engine to Transmission Control Module Communication',
  'P0860': 'Transmission Control Module Communication Circuit',
  'P0861': 'Transmission Control Module Communication Circuit Low',
  'P0862': 'Transmission Control Module Communication Circuit High',
  'P0863': 'Engine to Transmission Control Module Communication',
  'P0864': 'Engine to Transmission Control Module Communication',
  'P0865': 'Engine to Transmission Control Module Communication',
  'P0866': 'Engine to Transmission Control Module Communication',
  'P0867': 'Transmission Fluid Pressure Out of Range',
  'P0868': 'Transmission Fluid Pressure Low',
  'P0869': 'Transmission Fluid Pressure High',
  'P0870': 'Transmission Fluid Pressure Low',
  'P0871': 'Transmission Fluid Pressure High',
  'P0872': 'Transmission Fluid Pressure Low',
  'P0873': 'Transmission Fluid Pressure High',
  'P0874': 'Transmission Fluid Pressure Low',
  'P0875': 'Transmission Fluid Pressure High',
  'P0876': 'Transmission Fluid Pressure Low',
  'P0877': 'Transmission Fluid Pressure High',
  'P0878': 'Transmission Fluid Pressure Low',
  'P0879': 'Transmission Fluid Pressure High',
  'P0880': 'Transmission Control Module Power Relay De-Energized Too Early',
  'P0881': 'Transmission Control Module Power Relay De-Energized Too Late',
  'P0882': 'Transmission Control Module Power Relay Control Circuit Low',
  'P0883': 'Transmission Control Module Power Relay Control Circuit High',
  'P0884': 'Transmission Control Module Power Relay Sense Circuit Low',
  'P0885': 'Transmission Control Module Power Relay Sense Circuit High',
  'P0886': 'Transmission Control Module Power Relay De-Energized Too Early',
  'P0887': 'Transmission Control Module Power Relay De-Energized Too Late',
  'P0888': 'Transmission Control Module Power Relay Control Circuit Low',
  'P0889': 'Transmission Control Module Power Relay Control Circuit High',
  'P0890': 'Transmission Control Module Power Relay Sense Circuit Low',
  'P0891': 'Transmission Control Module Power Relay Sense Circuit High',
  'P0892': 'Transmission Control Module Power Relay De-Energized Too Early',
  'P0893': 'Transmission Control Module Power Relay De-Energized Too Late',
  'P0894': 'Transmission Control Module Power Relay Control Circuit Low',
  'P0895': 'Transmission Control Module Power Relay Control Circuit High',
  'P0896': 'Transmission Control Module Power Relay Sense Circuit Low',
  'P0897': 'Transmission Control Module Power Relay Sense Circuit High',
  'P0898': 'Transmission Control Module Power Relay De-Energized Too Early',
  'P0899': 'Transmission Control Module Power Relay De-Energized Too Late',
  'P0900': 'Clutch Actuator Control Circuit',
  'P0901': 'Clutch Actuator Control Circuit Range/Performance',
  'P0902': 'Clutch Actuator Control Circuit Low',
  'P0903': 'Clutch Actuator Control Circuit High',
  'P0904': 'Clutch Actuator Control Circuit Intermittent',
  'P0905': 'Transmission Range Sensor C Circuit',
  'P0906': 'Transmission Range Sensor C Circuit Low',
  'P0907': 'Transmission Range Sensor C Circuit High',
  'P0908': 'Transmission Range Sensor C Circuit Intermittent',
  'P0909': 'Transmission Range Sensor D Circuit',
  'P0910': 'Transmission Range Sensor D Circuit Low',
  'P0911': 'Transmission Range Sensor D Circuit High',
  'P0912': 'Transmission Range Sensor D Circuit Intermittent',
  'P0913': 'Transmission Range Sensor E Circuit',
  'P0914': 'Transmission Range Sensor E Circuit Low',
  'P0915': 'Transmission Range Sensor E Circuit High',
  'P0916': 'Transmission Range Sensor E Circuit Intermittent',
  'P0917': 'Transmission Range Sensor F Circuit',
  'P0918': 'Transmission Range Sensor F Circuit Low',
  'P0919': 'Transmission Range Sensor F Circuit High',
  'P0920': 'Transmission Range Sensor F Circuit Intermittent',
  'P0921': 'Transmission Range Sensor G Circuit',
  'P0922': 'Transmission Range Sensor G Circuit Low',
  'P0923': 'Transmission Range Sensor G Circuit High',
  'P0924': 'Transmission Range Sensor G Circuit Intermittent',
  'P0925': 'Transmission Range Sensor H Circuit',
  'P0926': 'Transmission Range Sensor H Circuit Low',
  'P0927': 'Transmission Range Sensor H Circuit High',
  'P0928': 'Transmission Range Sensor H Circuit Intermittent',
  'P0929': 'Transmission Range Sensor I Circuit',
  'P0930': 'Transmission Range Sensor I Circuit Low',
  'P0931': 'Transmission Range Sensor I Circuit High',
  'P0932': 'Transmission Range Sensor I Circuit Intermittent',
  'P0933': 'Transmission Range Sensor J Circuit',
  'P0934': 'Transmission Range Sensor J Circuit Low',
  'P0935': 'Transmission Range Sensor J Circuit High',
  'P0936': 'Transmission Range Sensor J Circuit Intermittent',
  'P0937': 'Transmission Range Sensor K Circuit',
  'P0938': 'Transmission Range Sensor K Circuit Low',
  'P0939': 'Transmission Range Sensor K Circuit High',
  'P0940': 'Transmission Range Sensor K Circuit Intermittent',
  'P0941': 'Transmission Range Sensor L Circuit',
  'P0942': 'Transmission Range Sensor L Circuit Low',
  'P0943': 'Transmission Range Sensor L Circuit High',
  'P0944': 'Transmission Range Sensor L Circuit Intermittent',
  'P0945': 'Transmission Range Sensor M Circuit',
  'P0946': 'Transmission Range Sensor M Circuit Low',
  'P0947': 'Transmission Range Sensor M Circuit High',
  'P0948': 'Transmission Range Sensor M Circuit Intermittent',
  'P0949': 'Transmission Range Sensor N Circuit',
  'P0950': 'Transmission Range Sensor N Circuit Low',
  'P0951': 'Transmission Range Sensor N Circuit High',
  'P0952': 'Transmission Range Sensor N Circuit Intermittent',
  'P0953': 'Transmission Range Sensor O Circuit',
  'P0954': 'Transmission Range Sensor O Circuit Low',
  'P0955': 'Transmission Range Sensor O Circuit High',
  'P0956': 'Transmission Range Sensor O Circuit Intermittent',
  'P0957': 'Transmission Range Sensor P Circuit',
  'P0958': 'Transmission Range Sensor P Circuit Low',
  'P0959': 'Transmission Range Sensor P Circuit High',
  'P0960': 'Transmission Range Sensor P Circuit Intermittent',
  'P0961': 'Fuel Pump Relay Control Circuit Low',
  'P0962': 'Fuel Pump Relay Control Circuit High',
  'P0963': 'Fuel Pump Relay Control Circuit Intermittent',
  'P0964': 'Fuel Pump Relay Control Circuit Low',
  'P0965': 'Fuel Pump Relay Control Circuit High',
  'P0966': 'Fuel Pump Relay Control Circuit Intermittent',
  'P0967': 'Fuel Pump Relay Control Circuit Low',
  'P0968': 'Fuel Pump Relay Control Circuit High',
  'P0969': 'Fuel Pump Relay Control Circuit Intermittent',
  'P0970': 'Fuel Pump Relay Control Circuit Low',
  'P0971': 'Fuel Pump Relay Control Circuit High',
  'P0972': 'Fuel Pump Relay Control Circuit Intermittent',
  'P0973': 'Shift Solenoid A Control Circuit Low',
  'P0974': 'Shift Solenoid A Control Circuit High',
  'P0975': 'Shift Solenoid B Control Circuit Low',
  'P0976': 'Shift Solenoid B Control Circuit High',
  'P0977': 'Shift Solenoid C Control Circuit Low',
  'P0978': 'Shift Solenoid C Control Circuit High',
  'P0979': 'Shift Solenoid D Control Circuit Low',
  'P0980': 'Shift Solenoid D Control Circuit High',
  'P0981': 'Shift Solenoid E Control Circuit Low',
  'P0982': 'Shift Solenoid E Control Circuit High',
  'P0983': 'Shift Solenoid F Control Circuit Low',
  'P0984': 'Shift Solenoid F Control Circuit High',
  'P0985': 'Shift Solenoid G Control Circuit Low',
  'P0986': 'Shift Solenoid G Control Circuit High',
  'P0987': 'Shift Solenoid H Control Circuit Low',
  'P0988': 'Shift Solenoid H Control Circuit High',
  'P0989': 'Shift Solenoid I Control Circuit Low',
  'P0990': 'Shift Solenoid I Control Circuit High',
  'P0991': 'Shift Solenoid J Control Circuit Low',
  'P0992': 'Shift Solenoid J Control Circuit High',
  'P0993': 'Shift Solenoid K Control Circuit Low',
  'P0994': 'Shift Solenoid K Control Circuit High',
  'P0995': 'Shift Solenoid L Control Circuit Low',
  'P0996': 'Shift Solenoid L Control Circuit High',
  'P0997': 'Shift Solenoid M Control Circuit Low',
  'P0998': 'Shift Solenoid M Control Circuit High',
  'P0999': 'Shift Solenoid N Control Circuit Low',
};

/**
 * OBD Scanner Service
 * Handles Bluetooth connection and OBD-II communication
 */
export class OBDScanner {
  private device: BluetoothDevice | null = null;
  private characteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private isConnected = false;
  private responseBuffer = '';

  /**
   * Check if Web Bluetooth is available
   */
  static async isAvailable(): Promise<boolean> {
    if (!navigator.bluetooth) {
      return false;
    }
    try {
      return await navigator.bluetooth.getAvailability();
    } catch {
      return false;
    }
  }

  /**
   * Request device selection from user
   */
  async requestDevice(): Promise<OBDDevice> {
    if (!navigator.bluetooth) {
      throw new Error('Web Bluetooth not supported in this browser');
    }

    const device = await navigator.bluetooth.requestDevice({
      filters: [
        { namePrefix: 'ELM' },
        { namePrefix: 'OBD' },
        { namePrefix: 'VGATE' },
        { namePrefix: 'BAFX' },
      ],
      optionalServices: ['0000ffe0-0000-1000-8000-00805f9b34fb'],
    });

    this.device = device;

    return {
      id: device.id,
      name: device.name || 'Unknown Device',
      device,
    };
  }

  /**
   * Connect to OBD device
   */
  async connect(): Promise<void> {
    if (!this.device) {
      throw new Error('No device selected');
    }

    try {
      const server = await this.device.gatt?.connect();
      if (!server) {
        throw new Error('Failed to connect to GATT server');
      }

      const service = await server.getPrimaryService(
        '0000ffe0-0000-1000-8000-00805f9b34fb'
      );
      this.characteristic = await service.getCharacteristic(
        '0000ffe1-0000-1000-8000-00805f9b34fb'
      );

      // Start listening for notifications
      await this.characteristic.startNotifications();
      this.characteristic.addEventListener(
        'characteristicvaluechanged',
        this.handleCharacteristicValueChanged.bind(this)
      );

      this.isConnected = true;

      // Initialize ELM327
      await this.sendCommand('AT Z'); // Reset
      await this.delay(500);
      await this.sendCommand('AT E0'); // Echo off
      await this.sendCommand('AT L0'); // Line feed off
      await this.sendCommand('AT S0'); // Space off
      await this.sendCommand('AT SP 6'); // Set protocol to CAN 500K
    } catch (error) {
      this.isConnected = false;
      throw error;
    }
  }

  /**
   * Disconnect from device
   */
  async disconnect(): Promise<void> {
    if (this.characteristic) {
      try {
        await this.characteristic.stopNotifications();
      } catch (error) {
        console.error('Error stopping notifications:', error);
      }
    }

    if (this.device?.gatt?.connected) {
      this.device.gatt.disconnect();
    }

    this.isConnected = false;
    this.device = null;
    this.characteristic = null;
  }

  /**
   * Read stored DTC codes
   */
  async readDTCs(): Promise<ScanResult> {
    if (!this.isConnected) {
      throw new Error('Not connected to OBD device');
    }

    try {
      this.responseBuffer = '';
      await this.sendCommand('03'); // Mode 0x03 - Read stored DTCs

      // Parse response
      const codes = this.parseDTCResponse(this.responseBuffer);

      return {
        dtcCount: codes.length,
        codes,
        timestamp: Date.now(),
      };
    } catch (error) {
      throw new Error(`Failed to read DTCs: ${error}`);
    }
  }

  /**
   * Clear DTC codes
   */
  async clearDTCs(): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Not connected to OBD device');
    }

    try {
      this.responseBuffer = '';
      await this.sendCommand('04'); // Mode 0x04 - Clear DTCs
    } catch (error) {
      throw new Error(`Failed to clear DTCs: ${error}`);
    }
  }

  /**
   * Get vehicle speed
   */
  async getVehicleSpeed(): Promise<number> {
    if (!this.isConnected) {
      throw new Error('Not connected to OBD device');
    }

    try {
      this.responseBuffer = '';
      await this.sendCommand('010D'); // Mode 0x01, PID 0x0D - Vehicle speed

      const speed = this.parseVehicleSpeed(this.responseBuffer);
      return speed;
    } catch (error) {
      throw new Error(`Failed to read vehicle speed: ${error}`);
    }
  }

  /**
   * Get engine RPM
   */
  async getEngineRPM(): Promise<number> {
    if (!this.isConnected) {
      throw new Error('Not connected to OBD device');
    }

    try {
      this.responseBuffer = '';
      await this.sendCommand('010C'); // Mode 0x01, PID 0x0C - Engine RPM

      const rpm = this.parseEngineRPM(this.responseBuffer);
      return rpm;
    } catch (error) {
      throw new Error(`Failed to read engine RPM: ${error}`);
    }
  }

  /**
   * Send AT command to device
   */
  private async sendCommand(command: string): Promise<string> {
    if (!this.characteristic) {
      throw new Error('No characteristic available');
    }

    const encoder = new TextEncoder();
    const data = encoder.encode(command + '\r');

    await this.characteristic.writeValue(data);

    // Wait for response
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Command timeout'));
      }, 2000);

      const checkResponse = () => {
        if (this.responseBuffer.includes('>')) {
          clearTimeout(timeout);
          resolve(this.responseBuffer);
        } else {
          setTimeout(checkResponse, 100);
        }
      };

      checkResponse();
    });
  }

  /**
   * Handle characteristic value changes
   */
  private handleCharacteristicValueChanged(
    event: Event
  ): void {
    const characteristic = (event.target as any as BluetoothRemoteGATTCharacteristic);
    const decoder = new TextDecoder();
    if (characteristic.value) {
      const value = decoder.decode(characteristic.value);
      this.responseBuffer += value;
    }
  }

  /**
   * Parse DTC response
   */
  private parseDTCResponse(response: string): DTCCode[] {
    const codes: DTCCode[] = [];

    // Response format: 43 <num_dtcs> <dtc1_byte1> <dtc1_byte2> <dtc2_byte1> <dtc2_byte2> ...
    const lines = response.split('\n');
    const dataLine = lines.find((line) => line.startsWith('43'));

    if (!dataLine) {
      return codes;
    }

    const parts = dataLine.split(' ').filter((p) => p.length > 0);
    if (parts.length < 2) {
      return codes;
    }

    const dtcCount = parseInt(parts[1], 16);

    for (let i = 0; i < dtcCount && i * 2 + 2 < parts.length; i++) {
      const byte1 = parseInt(parts[i * 2 + 2], 16);
      const byte2 = parseInt(parts[i * 2 + 3], 16);

      const dtcCode = this.decodeDTC(byte1, byte2);
      const description = DTC_DATABASE[dtcCode] || 'Unknown DTC';

      codes.push({
        code: dtcCode,
        description,
        type: dtcCode[0] as 'P' | 'C' | 'B' | 'U',
        severity: this.calculateSeverity(dtcCode),
      });
    }

    return codes;
  }

  /**
   * Decode DTC from two bytes
   */
  private decodeDTC(byte1: number, byte2: number): string {
    const firstChar = String.fromCharCode(0x50 + ((byte1 >> 6) & 0x03)); // P, C, B, U
    const secondChar = String.fromCharCode(0x30 + ((byte1 >> 4) & 0x03)); // 0-3
    const thirdChar = String.fromCharCode(0x30 + (byte1 & 0x0f)); // 0-9, A-F
    const fourthChar = String.fromCharCode(0x30 + ((byte2 >> 4) & 0x0f)); // 0-9, A-F
    const fifthChar = String.fromCharCode(0x30 + (byte2 & 0x0f)); // 0-9, A-F

    return firstChar + secondChar + thirdChar + fourthChar + fifthChar;
  }

  /**
   * Calculate severity based on DTC code
   */
  private calculateSeverity(
    code: string
  ): 'critical' | 'warning' | 'info' {
    // P0xxx codes related to emissions are critical
    if (code.startsWith('P0')) {
      return 'critical';
    }
    // C0xxx codes (chassis) are warnings
    if (code.startsWith('C0')) {
      return 'warning';
    }
    // B0xxx and U0xxx are info
    return 'info';
  }

  /**
   * Parse vehicle speed from response
   */
  private parseVehicleSpeed(response: string): number {
    // Response format: 410D <speed_value>
    const lines = response.split('\n');
    const dataLine = lines.find((line) => line.startsWith('410D'));

    if (!dataLine) {
      return 0;
    }

    const parts = dataLine.split(' ');
    if (parts.length < 2) {
      return 0;
    }

    const speedValue = parseInt(parts[1], 16);
    return speedValue; // Speed in km/h
  }

  /**
   * Parse engine RPM from response
   */
  private parseEngineRPM(response: string): number {
    // Response format: 410C <rpm_high> <rpm_low>
    const lines = response.split('\n');
    const dataLine = lines.find((line) => line.startsWith('410C'));

    if (!dataLine) {
      return 0;
    }

    const parts = dataLine.split(' ');
    if (parts.length < 3) {
      return 0;
    }

    const rpmHigh = parseInt(parts[1], 16);
    const rpmLow = parseInt(parts[2], 16);
    const rpm = ((rpmHigh * 256 + rpmLow) / 4).toFixed(0);
    return parseInt(rpm);
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  /**
   * Get device info
   */
  getDeviceInfo(): OBDDevice | null {
    if (!this.device) {
      return null;
    }

    return {
      id: this.device.id,
      name: this.device.name || 'Unknown Device',
      device: this.device,
    };
  }
}
