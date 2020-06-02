var init_win_env = function(win, preview, event_listener, screen_id){
    win.Jitsi = {};
    win.Jitsi._callbacks = {};
    win.Jitsi._actions = {};
    win.Jitsi._event_listener = event_listener;
    win.Jitsi._screen_id = screen_id;
    win.Jitsi.addAction = function(action, callback, params) {
        win.Jitsi._actions[action] = {
            callback: callback,
            params: params,
        }
        win.Jitsi._event_listener('action_add', win.Jitsi._screen_id, win.Jitsi._actions);
    };
    win.Jitsi.runAction = function(action, params) {
        if ('undefined' === win.Jitsi._actions[action]) {
            return;
        }
        win.Jitsi._actions[action].callback(params);
    };
    win.Jitsi.fire = function(event, data){
        if ('undefined' === typeof(win.Jitsi._callbacks[event])) {
            return;
        }
        for (var callback of win.Jitsi._callbacks[event]) {
            callback(data);
        }
    };
    win.Jitsi.on = function(event, callback){
        if ('undefined' === typeof(win.Jitsi._callbacks[event])) {
            win.Jitsi._callbacks[event] = [];
        }
        win.Jitsi._callbacks[event].push(callback);
    };
    win.Jitsi.getMyID = function(){
        if (preview) {
            return 'me';
        } else {
            if (!room) {
                return 'me';
            }
            return room.myUserId();
        }
    };
    win.Jitsi.getUser = function(id){
        if (preview) {
            var first = true;
            if ('undefined' === typeof(preview_fake_users[id])) {
                return {};
            }

            return {id: id, name: 'User-' + id, me: id == 0};
        } else {
            if (!room) {
                return [];
            }
            users = [];
            if (id == room.myUserId()) {
                var my_properties = {};
                room.room.presMap.nodes.map(function(a){ if (a.tagName.match(/^jitsi_participant_/)) { my_properties[a.tagName.substr(18)] = a.value; }});
                return {id: room.myUserId(), name: room.myName, me: true, properties: my_properties};
            } else {
                if ('undefined' === typeof(room.participants[id])) {
                    return null;
                }
                return {id: id, name: room.participants[id].getDisplayName(), me: false, properties: room.participants[id]._properties};
            }
        }
    };
    win.Jitsi.getUsers = function(){
        if (preview) {
            var first = true;
            return preview_fake_users.map(function(id){
                if (first) {
                    var me = true;
                    first = false;
                } else {
                    var me = false;
                }
                return {id: id, name: 'User-' + id, me: me};
            });
        } else {
            if (!room) {
                return [];
            }
            users = [];
            var my_properties = {};
            room.room.presMap.nodes.map(function(a){ if (a.tagName.match(/^jitsi_participant_/)) { my_properties[a.tagName.substr(18)] = a.value; }});
            users.push({id: room.myUserId(), name: room.myName, me: true, properties: my_properties});
            for (var id in room.participants) {
                users.push({id: id, name: room.participants[id].getDisplayName(), me: false, properties: room.participants[id]._properties});
            }
            return users;
        }
        return [];
    };
    win.Jitsi.reload = function(){
        if (preview) {
            update_preview_video();
        } else {
            update_screen_video();
        }
    };
};

var auto_detach_track = function(){
    if (!room) {
        return;
    }
    for (var id in room.participants) {
        for (var track of room.participants[id]._tracks) {
            for (var container of track.containers) {
                var win = container.getRootNode().defaultView;
                if (win === null || 'undefined' === typeof(win) || win._isUnloading) {
                    track.detach(container);
                }
            }
        }
    }
};

var reselected_users = function(){
    var users = [];
    for (var user_id in selected_users) {
        users.push(user_id);
    }
    console.log(selected_users);
    room.selectParticipants(users);
};
var selected_users = {};

var restore_inactive_track = function(){
    for (var id in room.participants) {
        var status = room.participantConnectionStatus.connectionStatusMap[id];
        var attach_count = 0;

        if ('undefined' === typeof(status)) {
            continue;
        }
        status = status.connectionStatus;

        for (var track of room.participants[id]._tracks) {
            if (track.type != 'video') {
                continue;
            }
            attach_count += track.containers.length;
        }
        if (status == 'inactive' && 'undefined' === typeof(selected_users[id]) && attach_count > 0) {
            selected_users[id] = 'restoring';
            reselected_users();
        } else if (status == 'active' && 'restoring' === selected_users[id]) {
            delete(selected_users[id]);
            reselected_users();
        }
    }
};

