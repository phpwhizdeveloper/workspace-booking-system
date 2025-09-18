<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use App\Models\Booking;
use App\Models\Workspace;
use Carbon\Carbon;

class BookingController extends Controller
{
    public function index(Request $request)
    {
        $booking = Booking::all();

        // Return JSON response with a success message and data
        return response()->json([
            'success' => true,
            'message' => 'booking retrieved successfully.',
            'data' => $booking
        ], 200);
    }

    public function store(Request $request)
    {

        $validated = $request->validate([
            'workspace_id' => ['required', 'integer', 'exists:workspaces,id'],
            'start_time' => ['required', 'date'],
            'end_time' => ['required', 'date', 'after:start_time'],
            'username' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'notes' => ['nullable', 'string'],
        ]);

        $validated['user_id'] = 1;

        $start = new \DateTime($validated['start_time']);
        $end = new \DateTime($validated['end_time']);

        // Ensure workspace exists (extra guard) and is active if you add such a column later
        $workspace = Workspace::findOrFail($validated['workspace_id']);

        $conflict = Booking::where('workspace_id', $workspace->id)
            // ->where('status', 'confirmed')
            ->where(function ($q) use ($start, $end) {
                $q->where('start_time', '<', $end)
                  ->where('end_time', '>', $start);
            })
            ->orderBy('start_time')
            ->first();

        if ($conflict) {
            $from = Carbon::parse($conflict->start_time)->format('Y-m-d H:i:s');
            $to = Carbon::parse($conflict->end_time)->format('Y-m-d H:i:s');
            return response()->json([
                'success' => false,
                'message' => "This workspace is already booked from $from to $to",
            ], 422);
        }

        $booking = Booking::create([
            'user_id' => $validated['user_id'],
            'workspace_id' => $validated['workspace_id'],
            'start_time' => $start,
            'end_time' => $end,
            'username' => $validated['username'],
            'email' => $validated['email'],
            'notes' => $validated['notes'] ?? '',
            'status' => 'pending',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Booking workspace successfully.',
            'data' => $booking,
        ], 201);
    }

    public function show(Booking $booking)
    {
        $booking->load(['workspace']);

        return response()->json([
            'success' => true,
            'message' => 'Booking retrieved successfully.',
            'data' => $booking,
        ], 200);
    }

    public function update(Request $request, Booking $booking)
    {
        $validated = $request->validate([
            'start_time' => ['sometimes', 'required', 'date'],
            'end_time' => ['sometimes', 'required', 'date', 'after:start_time'],
            'status' => ['sometimes', 'required', Rule::in(['pending', 'confirmed', 'cancelled'])],
            'username' => ['sometimes', 'required', 'string', 'max:255'],
            'email' => ['sometimes', 'required', 'email', 'max:255'],
        ]);

        $start = array_key_exists('start_time', $validated) ? new \DateTime($validated['start_time']) : new \DateTime($booking->start_time);
        $end = array_key_exists('end_time', $validated) ? new \DateTime($validated['end_time']) : new \DateTime($booking->end_time);

        // Overlap check only if times are changing and booking is not cancelled
        if (($request->has('start_time') || $request->has('end_time')) && ($booking->status !== 'cancelled')) {
            $conflict = Booking::where('workspace_id', $booking->workspace_id)
                ->where('id', '!=', $booking->id)
                ->where('status', 'confirmed')
                ->where(function ($q) use ($start, $end) {
                    $q->where('start_time', '<', $end)
                      ->where('end_time', '>', $start);
                })
                ->orderBy('start_time')
                ->first();

            if ($conflict) {
                $from = Carbon::parse($conflict->start_time)->format('Y-m-d H:i:s');
                $to = Carbon::parse($conflict->end_time)->format('Y-m-d H:i:s');
                return response()->json([
                    'success' => false,
                    'message' => "This workspace is already booked from $from to $to",
                ], 422);
            }
        }

        $booking->start_time = $start;
        $booking->end_time = $end;
        if (array_key_exists('status', $validated)) {
            $booking->status = $validated['status'];
        }
        if (array_key_exists('username', $validated)) {
            $booking->username = $validated['username'];
        }
        if (array_key_exists('email', $validated)) {
            $booking->email = $validated['email'];
        }
        $booking->save();

        return response()->json([
            'success' => true,
            'message' => 'Booking updated successfully.',
            'data' => $booking,
        ], 200);
    }

    public function statusUpdate(Request $request, Booking $booking)
    {
        $validated = $request->validate([
            'status' => ['required', Rule::in(['pending', 'confirmed', 'cancelled'])],
        ]);

        $newStatus = $validated['status'];

        $booking->status = $newStatus;
        $booking->save();

        return response()->json([
            'success' => true,
            'message' => 'Booking status updated successfully.',
            'data' => $booking,
        ], 200);
    }

    public function destroy(Booking $booking)
    {
        $booking->delete();

        return response()->json([
            'success' => true,
            'message' => 'Booking deleted successfully.',
        ], 200);
    }

    public function cancel(Booking $booking)
    {
        $booking->status = 'cancelled';
        $booking->save();

        return response()->json([
            'success' => true,
            'message' => 'Booking cancelled successfully.',
            'data' => $booking,
        ], 200);
    }
}
