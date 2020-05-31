var init_win_env = function(win, preview){
    win.Jitsi = {};
    win.Jitsi._callbacks = {};
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
            users.push({id: room.myUserId(), name: $('[name="name"]').val(), me: true, properties: my_properties});
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
