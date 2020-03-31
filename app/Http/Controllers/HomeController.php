<?php

namespace App\Http\Controllers;

use App\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Pusher\Pusher;
class HomeController extends Controller
{
    /**
     * Create a new controller instance.
     *
     * @return void
     */
    public function __construct()
    {
        $this->middleware('auth');
    }

    /**
     * Show the application dashboard.
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function index()
    {
        $user = Auth::user();
        $user->isonline = 1;
        $user->save();
        $users = User::all()->toJson();
//        $online = 0;
//            if ($users->isOnline()) {
//                $online = 1;
//            }


        return view('home', compact('users'));
    }
//    public function logout()
//    {
//        $user = Auth::user();
//        $user->isonline = 0;
//        $user->save();
//
//        return view('welcome');
//    }
    public function authenticate(Request $request) {

        $socket_id = $request->socket_id;
        $channel_name = $request->channel_name;

        $pusher = new Pusher('1a11d2223ae84ccafdce', 'a609fd95fcccdd55dbc7', '971804', [
            'cluster'=> 'eu',
            'encrypted'=> true
        ]);

        $presence_data = ['name'=>auth()->user()->name];

        $key = $pusher->presence_auth($channel_name, $socket_id, auth()->id(), $presence_data);

        return response($key);
    }
}
