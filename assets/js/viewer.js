
var current_data = { 'version': -1 };
var windows = {};

var check_resize = function (win, width, height) {
    if (win.innerWidth == 0 || win.outerWidth == 0) {
        setTimeout(function () { check_resize(win, width, height); }, 100);
        return;
    }
    win.resizeTo(width + win.outerWidth - win.innerWidth, height + win.outerHeight - win.innerHeight);
};

var get_list_from_content = function (content) {
    var dom = $('<div></div>').append($(content));
    var list_map = {};
    $('.video-box', dom).each(function () {
        var id = $(this).data('id');
        if ('undefined' === typeof (id)) {
            return;
        }
        list_map[id] = true;
    });
    var list = [];
    for (var id in list_map) {
        list.push(id);
    }
    return list;
};

var matches = location.search.match(/[?&]jitsi_room_url=([^?&]*)/);
if (matches) {
    $('[name="url"]').val(decodeURIComponent(matches[1]));
}

var host_id;
var matches = location.search.match(/[?&]host_id=([^?&]*)/);
if (matches) {
    host_id = decodeURIComponent(matches[1]);
}

viewer_name = localStorage.getItem('viewer-name');
if (viewer_name) {
    $('#jitsi-form [name="name"]').val(viewer_name);
}

const initOptions = {
    disableAudioLevels: false,

    disableSimulcast: true,
    // The ID of the jidesha extension for Chrome.
    desktopSharingChromeExtId: 'mbocklcggfhnbahlnepmldehdhpjfcjp',

    // Whether desktop sharing should be disabled on Chrome.
    desktopSharingChromeDisabled: false,

    // The media sources to use when using screen sharing with the Chrome
    // extension.
    desktopSharingChromeSources: ['screen', 'window'],

    // Required version of Chrome extension
    desktopSharingChromeMinExtVersion: '0.1',

    // Whether desktop sharing should be disabled on Firefox.
    desktopSharingFirefoxDisabled: false,
};

var jitsi_domain;
var jitsi_room;
var connection;
var onDeviceListChanged = function (devices) {
    update_devices();
};

$('#toggle-footer').on('click', function (e) {
    if ($('#footer').hasClass("d-none")) {
        $('#footer').removeClass("d-none");
        $('.arrow').css({ 'transform': 'rotate(45deg)', '-webkit-transform': 'rotate(45deg)' });
    }
    else {
        $('#footer').addClass("d-none");
        $('.arrow').css({ 'transform': 'rotate(-135deg)', '-webkit-transform': 'rotate(-135deg)' });
    }
});

$('#jitsi-form').submit(function (e) {
    e.preventDefault();
    var matches = $('[name="url"]').val().match('^https://([^/]*)/([^&]*)$');
    if (!matches) {
        alert('網址不正確');
        return;
    }
    $('#enter-div').hide();
    $('#loading-div').show();
    localStorage.setItem('viewer-name', $('#jitsi-form [name="name"]').val());

    jitsi_domain = matches[1];
    jitsi_room = matches[2].toLowerCase();
    $.getScript('//' + jitsi_domain + '/libs/lib-jitsi-meet.min.js')
        .done(function (script, textStatus) {
            JitsiMeetJS.setLogLevel(JitsiMeetJS.logLevels.ERROR);
            JitsiMeetJS.init(initOptions);
            const options = {
                hosts: {
                    domain: jitsi_domain,
                    muc: 'conference.' + jitsi_domain,
                    focus: 'focus.' + jitsi_domain,
                },
                bosh: 'wss://' + jitsi_domain + '/xmpp-websocket',
                websocket: 'wss://' + jitsi_domain + '/xmpp-websocket',

                // The name of client node advertised in XEP-0115 'c' stanza
                clientNode: 'http://jitsi.org/jitsimeet'
            };
            options.bosh += '?room=' + jitsi_room;
            options.websocket += '?room=' + jitsi_room;
            connection = new JitsiMeetJS.JitsiConnection(null, null, options);
            connection.addEventListener(JitsiMeetJS.events.connection.CONNECTION_ESTABLISHED, onConnected);
            connection.addEventListener(JitsiMeetJS.events.connection.CONNECTION_FAILED, function () { alert('連線失敗'); });
            JitsiMeetJS.mediaDevices.addEventListener(
                JitsiMeetJS.events.mediaDevices.DEVICE_LIST_CHANGED,
                onDeviceListChanged);

            if ($('[name="password"]').val()) {
                connection.connect({
                    password: $('[name="password"]').val(),
                });
            } else {
                connection.connect();
            }
        });
});


var update_screen_video = function () {

    for (var id in selected_users) {
        if (selected_users[id] == 'select') {
            delete (selected_users[id]);
        }
    }

    var user_select = {};
    if (!current_screen_id) {
        return;
    }
    if (current_screen_id !== null) {
        user_select = current_data.screens[current_screen_id].user_select;
    }
    win = $('#result-iframe')[0].contentWindow;
    $("#audio-pool").html("");
    $('.video-box', win.document).each(function () {
        user_id = user_select[$(this).attr('data-id')];
        if ('undefined' === typeof (user_id)) {
            user_id = $(this).attr('data-user');
        }
        if ('undefined' === typeof (user_id)) {
            return;
        }
        if (!$('video', this).length) {
            $(this).append($('<video style="width: 100%; height: 100%; border: 0; margin: 0; padding: 0" autoplay="1" muted></video>'));
        }

        if (!$(`#audio-${user_id}`).length && 'undefined' !== typeof (room.participants[user_id])) {
            var audio_dom = $('<audio autoplay="1"></audio>').attr('id', 'audio-' + user_id);
            $('#audio-pool').append(audio_dom);
            audio_track = room.participants[user_id].getTracksByMediaType('audio')[0];
            if (audio_track && audio_dom) {
                audio_track.attach(audio_dom[0]);
            }
        }

        var video_dom = $('video', this);
        var user_name = "none";
        if (user_id == 'none') {
            var old_track = video_dom[0].__track;
            if (old_track) {
                old_track.detach(video_dom[0]);
            }
            video_dom.hide();
        } else if (user_id == 'viewer') {
            user_name = viewer_name;
            var track = room.getLocalVideoTrack();
            var old_track = video_dom[0].__track;
            if (old_track) {
                old_track.detach(video_dom[0]);
            }
            if (track) {
                video_dom.show();
                track.attach(video_dom[0]);
                video_dom[0].__track = track;
                video_dom[0].play();
            }
        } else if (user_id.match && user_id.match(/^camera-/)) {
            var device_id = user_id.split('-')[1];
            get_local_video_track(device_id, function (track) {
                var old_track = video_dom[0].__track;
                if (old_track) {
                    old_track.detach(video_dom[0]);
                }
                video_dom.show();
                track.attach(video_dom[0]);
                video_dom[0].__track = track;
                video_dom[0].play();
            });
        } else {
            if (user_id == room.myUserId()) {
                user_name = viewer_name;
                var track = room.getLocalVideoTrack();
                var tracks = [];
                if ('undefined' !== typeof (track)) {
                    tracks.push(track);
                }
            } else if ('undefined' !== typeof (room.participants[user_id])) {
                user_name = room.participants[user_id].getDisplayName();
                var tracks = room.participants[user_id].getTracksByMediaType('video');
            } else {
                return;
            }

            var old_track = video_dom[0].__track;
            if (old_track) {
                old_track.detach(video_dom[0]);
            }
            video_dom.show();
            if (tracks.length) {
                tracks[0].attach(video_dom[0]);
                if ($(this).attr('data-select') == 'true') {
                    selected_users[user_id] = 'select';
                    room.selectParticipant(user_id);
                }

                video_dom[0].__track = tracks[0];
                video_dom[0].play();
            }
        }
        $('username', $(this)).text(user_name);
    });
    reselected_users();
};

var room;
var device_list = { audio: [], video: [] };

$('#output-audio').change(function () {
    var id = $(this).val();
    var promises = [];
    for (var track of room.getLocalTracks()) {
        if (track.getType() != 'audio') continue;
        promises.push(room.removeTrack(track));
    }

    Promise.all(promises).then(function () {
        if ('none' == id) {
        } else {
            get_local_audio_track(id, function (track) {
                room.addTrack(track);
            });
        }
    });
});

var update_devices = function (tracks) {
    if (JitsiMeetJS.mediaDevices.isDeviceChangeAvailable('output')) {
        JitsiMeetJS.mediaDevices.enumerateDevices(devices => {
            $('#output-video').html('');
            $('#output-audio').html('');
            device_list.audio = [];
            device_list.video = [];
            $('#output-video').append($('<option></option>').attr('value', 'none').text('不使用'));
            $('#output-video').append($('<option></option>').attr('value', 'screenshare').text('螢幕分享'));
            $('#output-audio').append($('<option></option>').attr('value', 'none').text('不使用'));
            var has_video = false;
            var has_audio = false;
            for (var device of devices) {
                if (device.kind == 'audioinput' && device.label != '') {
                    $('#output-audio').append($('<option></option>').attr('val', device.deviceId).text(device.label));
                    has_audio = true;
                    device_list.audio.push(device);
                }
                if (device.kind == 'videoinput' && device.label != '') {
                    $('#output-video').append($('<option></option>').attr('val', device.deviceId).text(device.label));
                    has_video = true;
                    device_list.video.push(device);
                }
            }
            if (has_audio) {
                $('#output-audio').show();
                $('#btn-access-audio').hide();
            }
            if (has_video) {
                $('#output-video').show();
                $('#btn-access-video').hide();
            }
        });
    }
};


$('#btn-access-video').click(function (e) {
    e.preventDefault();
    JitsiMeetJS.createLocalTracks({ devices: ['video'] })
        .then(update_devices)
        .catch(error => {
            throw error;
        });
});
$('#btn-access-audio').click(function (e) {
    e.preventDefault();
    JitsiMeetJS.createLocalTracks({ devices: ['audio'] })
        .then(update_devices)
        .catch(error => {
            throw error;
        });
});

var onConnected = function () {
    var confOptions = {
        openBridgeChannel: 'websocket',
        confID: jitsi_domain + '/' + jitsi_room
    };

    $('#jitsi-url').text('https://' + jitsi_domain + '/' + jitsi_room);
    update_devices();

    $('#loading-div').text('連線成功，加入房間中...');

    room = connection.initJitsiConference(jitsi_room, confOptions);
    room.myName = $('#jitsi-form [name="bot-name"]').val();
    room.setDisplayName($('#jitsi-form [name="name"]').val());
    room.on(
        JitsiMeetJS.events.conference.CONFERENCE_FAILED,
        function (error) {
            alert("CONFERENCE_FAILED:" + error);
        });
    room.on(
        JitsiMeetJS.events.conference.CONFERENCE_ERROR,
        function (error) {
            alert("CONFERENCE_ERROR:" + error);
        });
    room.on(
        JitsiMeetJS.events.conference.CONFERENCE_JOINED,
        function () {
            $('#loading-div').text('加入房間成功，與主持人連絡中...');
            if (room.getParticipantCount() == 1) {
                $('#loading-div').text('主持人不在線上，等待主持人加入中...');
            }

            room.on(JitsiMeetJS.events.conference.DATA_CHANNEL_OPENED, () => {
                room.broadcastEndpointMessage({ type: 'request_scene', host_id: host_id, message: {} });
            });

            room.on(JitsiMeetJS.events.conference.PARTICIPANT_CONN_STATUS_CHANGED, (id, status) => {
                if (status == 'inactive' && 'undefined' === typeof (selected_users[id])) {
                    var attach_count = 0;
                    for (var track of room.participants[id].getTracksByMediaType('video')) {
                        attach_count += track.containers.length;
                    }
                    if (attach_count) {
                        selected_users[id] = 'restoring';
                        reselected_users();
                    }
                } else if (status == 'active' && 'restoring' === selected_users[id]) {
                    delete (selected_users[id]);
                    reselected_users();
                }
            });

            room.on(JitsiMeetJS.events.conference.USER_JOINED, (id, user) => {
                for (var idx in windows) {
                    windows[idx].Jitsi.fire('user_joined', { id: id, name: user.getDisplayName() });
                }
            });
            room.on(JitsiMeetJS.events.conference.USER_LEFT, (id, user) => {
                for (var idx in windows) {
                    windows[idx].Jitsi.fire('user_left', { id: id, name: user.getDisplayName() });
                }
                update_screen_video();
            });
            room.on(JitsiMeetJS.events.conference.TRACK_ADDED, (track) => {
                update_screen_video();
            });
            room.on(JitsiMeetJS.events.conference.TRACK_REMOVED, (track) => {
                if (track.type == 'audio' && track.ownerEndpointId && $('#audio-' + track.ownerEndpointId).length) {
                    track.detach($('#audio-' + track.ownerEndpointId)[0]);
                }
            });
            room.on(JitsiMeetJS.events.conference.TRACK_MUTE_CHANGED, (track) => {
            });
            room.on(JitsiMeetJS.events.conference.TRACK_AUDIO_LEVEL_CHANGED, level_changed);
            room.on(JitsiMeetJS.events.conference.ENDPOINT_MESSAGE_RECEIVED, (participant, message) => {
                if (message.type == 'response_scene') {
                    if (host_id == message.host_id && message.message.current_data.version != current_data.version) {
                        current_data = message.message.current_data;
                        update_content();
                    }
                } else if (message.type == 'update_scene') {
                    if (host_id == message.host_id && message.message.current_data.version != current_data.version) {
                        current_data = message.message.current_data;
                        update_content();
                    }
                }
            });
        });

    if ($('[name="password"]').val()) {
        room.join($('[name="password"]').val());
    } else {
        room.join();
    }
}
var current_screen_id;

var update_content = function () {
    var hit_screen = null;
    var hit_screen_id = null;
    for (var screen_id in current_data.screens) {
        screen = current_data.screens[screen_id];
        var viewers = screen.viewers.map(function (a) { return a.split('-')[0]; });
        if (viewers.indexOf('default') >= 0) {
            console.log("index: " + viewers.indexOf('default'));
            console.log("hit_screen_id: " + screen_id);
            hit_screen_id = screen_id;
            hit_screen = screen;
            break;
        }
    }
    if ($('#loading-div').is(':visible')) {
        $('#loading-div').hide();
        $('#result-box').removeClass("d-none");
    }
    if (current_data.screens.length == 0) {
        console.log("NULL SCENE");
        current_screen_id = null;
        init_win_env($('#result-iframe')[0].contentWindow, false);
        var content = `<div style="height: 100%; width: 100%"><h1>暫無畫面</h1></div>`;
        $('#result-iframe')[0].contentDocument.open();
        $('#result-iframe')[0].contentDocument.write(content);
        return;
    }
    if (hit_screen_id != current_screen_id) {
        current_screen_id = hit_screen_id;
        init_win_env($('#result-iframe')[0].contentWindow, false);
        var content = hit_screen.content;

        $('#result-iframe')[0].contentDocument.open();
        $('#result-iframe')[0].contentDocument.write(content);
        $('#result-iframe').contents().find('html').css('overflow', 'hidden');
    }
    update_screen_video();
};

var local_tracks = {};

function get_local_video_track(device_id, callback) {
    if (local_tracks[device_id]) {
        callback(local_tracks[device_id]);
        return;
    }
    JitsiMeetJS.createLocalTracks({ devices: ['video'], cameraDeviceId: device_id })
        .then(function (tracks) {
            local_tracks[device_id] = tracks[0];
            callback(tracks[0]);
        })
        .catch(error => {
            throw error;
        });
};

function get_local_audio_track(device_id, callback) {
    if (local_tracks[device_id]) {
        callback(local_tracks[device_id]);
        return;
    }
    JitsiMeetJS.createLocalTracks({ devices: ['audio'], cameraDeviceId: device_id })
        .then(function (tracks) {
            local_tracks[device_id] = tracks[0];
            tracks[0].addEventListener(JitsiMeetJS.events.track.TRACK_AUDIO_LEVEL_CHANGED, function (audioLevel) {
                level_changed(room ? room.myUserId() : 'me', audioLevel);
            });
            callback(tracks[0]);
        })
        .catch(error => {
            throw error;
        });
};

$(window).bind('beforeunload', unload);
$(window).bind('unload', unload);
function unload() {
    if (room) {
        room.leave();
    }
    if (connection) {
        connection.disconnect();
    }

    for (var idx in windows) {
        windows[idx].close();
    }
}

var level_changed = function (participant, audioLevel) {
};

$('#output-video').change(function (e) {
    var id = $(this).val();
    var promises = [];
    for (var track of room.getLocalTracks()) {
        if (track.getType() != 'video') continue;
        promises.push(room.removeTrack(track));
        if (track.videoType == 'desktop') {
            track.dispose();
        }
        $(`#user-list-${room.myUserId()} .video-stat`).removeClass('fa-video').addClass('fa-video-slash');
    }

    Promise.all(promises).then(function () {
        if ('none' == id) {
            update_screen_video();
        } else if ('screenshare' == id) {
            JitsiMeetJS.createLocalTracks({ devices: ['desktop'] })
                .then(function (tracks) {
                    room.addTrack(tracks[0]).then(update_screen_video);
                    $(`#user-list-${room.myUserId()} .video-stat`).addClass('fa-video').removeClass('fa-video-slash');
                })
                .catch(error => {
                });
        } else {
            get_local_video_track(id, function (track) {
                room.addTrack(track).then(update_screen_video);
                $(`#user-list-${room.myUserId()} .video-stat`).addClass('fa-video').removeClass('fa-video-slash');
            });
        }
    });
});
