<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Workspace;
use Illuminate\Support\Facades\Schema;

class WorkspaceController extends Controller
{
    public function index(Request $request)
    {
        // Retrieve all workspaces
        $workspaces = Workspace::all();

        // Return JSON response with a success message and data
        return response()->json([
            'success' => true,
            'message' => 'Workspaces retrieved successfully.',
            'data' => $workspaces
        ], 200);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'image' => ['required','image','mimes:jpg,jpeg,png','max:5120'],
            'description' => ['required', 'string'],
            'status' => ['sometimes', 'boolean'],
        ]);

        // Cache schema checks
        $hasImageData = Schema::hasColumn('workspaces', 'image_data');
        $hasImageMime = Schema::hasColumn('workspaces', 'image_mime');
        $hasImageSize = Schema::hasColumn('workspaces', 'image_size');
        $hasStatus = Schema::hasColumn('workspaces', 'status');

        $imageData = null;
        $imageMime = null;
        $imageSize = null;
        $imageName = '';

        if ($request->hasFile('image')) {
            $file = $request->file('image');
            $imageName = $file->store('workspaces', 'public');
            $imageMime = $file->getMimeType();
            $imageSize = $file->getSize();
            if ($hasImageData) {
                $imageData = base64_encode($file->get());
            }
        }

        $payload = [
            'title' => $validated['title'],
            'description' => $validated['description'],
            'image' => $imageName,
            'status' =>  $validated['status'],
        ];

        if ($hasImageData) {
            $payload['image_data'] = $imageData;
        }
        if ($hasImageMime) {
            $payload['image_mime'] = $imageMime;
        }
        if ($hasImageSize) {
            $payload['image_size'] = $imageSize;
        }

        // if ($hasStatus) {
        //     $payload['status'] = array_key_exists('status', $validated) ? (int) $validated['status'] : 1;
        // }

        $workspace = Workspace::create($payload);

        return response()->json([
            'success' => true,
            'message' => 'Workspace created successfully.',
            'data' => $workspace,
        ], 201);
    }

}
