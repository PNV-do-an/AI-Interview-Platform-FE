import { useCallback, useState } from 'react';
import ProgramService from '../services/program.service';
import { Slot, SlotRequest } from '../models/Program.model';

export const useSlotController = () => {
  const [mySlots, setMySlots] = useState<Slot[]>([]);
  const [availableSlots, setAvailableSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const clearMessages = () => { setError(''); setSuccessMsg(''); };

  const fetchMySlots = useCallback(async () => {
    setLoading(true);
    clearMessages();
    try {
      const res = await ProgramService.getMySlots();
      setMySlots(res.data.data!);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to load time slots');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAvailableSlots = useCallback(async (employerId: number) => {
    setLoading(true);
    clearMessages();
    try {
      const res = await ProgramService.getAvailableSlots(employerId);
      setAvailableSlots(res.data.data!);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to load available slots');
    } finally {
      setLoading(false);
    }
  }, []);

  const createSlot = useCallback(async (body: SlotRequest) => {
    clearMessages();
    try {
      await ProgramService.createSlot(body);
      setSuccessMsg('Time slot created');
      return true;
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to create time slot');
      return false;
    }
  }, []);

  const cancelSlot = useCallback(async (id: number) => {
    clearMessages();
    try {
      await ProgramService.cancelSlot(id);
      setSuccessMsg('Time slot cancelled');
      return true;
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to cancel time slot');
      return false;
    }
  }, []);

  return {
    mySlots, availableSlots, loading, error, successMsg,
    fetchMySlots, fetchAvailableSlots, createSlot, cancelSlot, clearMessages,
  };
};
