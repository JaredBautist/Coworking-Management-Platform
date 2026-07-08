export type UserRole = 'office_manager' | 'member'
export type SpaceType = 'desk' | 'meeting_room' | 'phone_booth' | 'event_space'
export type ReservationStatus = 'confirmed' | 'cancelled'

export interface Organization {
  id: string
  name: string
  created_at: string
}

export interface Profile {
  id: string
  org_id: string
  full_name: string
  email: string
  role: UserRole
  created_at: string
}

export interface Space {
  id: string
  org_id: string
  name: string
  type: SpaceType
  capacity: number
  is_active: boolean
  created_at: string
}

export interface Reservation {
  id: string
  org_id: string
  space_id: string
  user_id: string
  start_time: string
  end_time: string
  status: ReservationStatus
  summary?: string
  created_at: string
  space?: Pick<Space, 'id' | 'name' | 'type' | 'capacity'>
  profile?: Pick<Profile, 'id' | 'full_name' | 'email'>
}

export interface SpaceUtilization {
  space_id: string
  name: string
  org_id: string
  total_reservations: number
  total_hours_booked: number
  space_type?: SpaceType
  occupancy_rate?: number | null
}

export interface Invitation {
  id: string
  org_id: string
  email: string
  role: UserRole
  invited_by: string | null
  status: 'pending' | 'accepted'
  created_at: string
}

export interface AuthUser {
  id: string
  email: string
  profile: Profile
  org_id: string
}

export interface SpaceFormData {
  name: string
  type: SpaceType
  capacity: number
  is_active: boolean
}

export interface ReservationSearchParams {
  date: string
  start_time: string
  end_time: string
  space_type?: SpaceType
  min_capacity?: number
}
