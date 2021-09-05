var jitsi_login_data = {};

var default_data = {
    scenes: {},
    screens: [],
};

var scene_config = 'scenes/scenes.json';
var message_logs = [];
var current_data = null;
var windows = {};
var preview_window = null;

var load_data = function (data) {
    current_data = data;
    localStorage.setItem('current_data', JSON.stringify(current_data.scenes));
    $('#scene-list').html('');
    for (var scene_id in current_data.scenes) {
        var li_dom = $('<li><div><a class="scene-list-title"></a></div></li>');
        var scene = current_data.scenes[scene_id];
        $(".scene-list-title", li_dom).text(scene.name);
        $("div", li_dom).append($('<button></button>').text('選擇模板').addClass('btn btn-dark btn-sm btn-preview'));
        $("div", li_dom).append($('<button></button>').html('<i class="fas fa-trash-alt"></i>').addClass('btn btn-danger btn-sm btn-delete-scene'));
        li_dom.data('id', scene_id);
        $('#scene-list').append(li_dom);
    }
};

var load_default = function () {
    load_data(default_data);
}

var get_absolute_url = function (ref_url, path) {
    var ref_url = (new URL(ref_url, document.location)).href;
    return (new URL(path, ref_url)).href;
}

var randomString = function () {
    var taglist = ["Congress", "Media", "ChildrenandChildren", "g0v", "GovernmentProcurement", "Population", "Politics", "Welfare", "Election", "Education", "Labor", "Ecology", "Law", "Architecture", "Transportation", "Energy", "DemocraticParticipation", "Finance", "Knowledge", "Language",
        "Land", "Map", "Agenda", "Contacts", "Animals", "Environment", "PublicWelfare", "Visualization", "Art", "Agriculture", "Life", "CivilService", "Record", "Community", "News", "Supervision",
        "LeftFood", "Hackathon", "Urban", "Economy", "History", "NPO", "Tools", "OpenCulture", "Translation", "LandAdministration", "OpenInformation", "Sharing", "Database", "Text", "Policy",
        "Disaster", "Game", "Statistics", "Gender", "Text", "Medical", "TransitionalJustice", "FactCheck", "IndigenousPeople", "OpenGovernment", "Parliament", "Birth", "Psychology", "Labor", "China", "Meteorology", "Residence", "Homelessness", "Health", "CitizenParticipation",
        "GenderEquality", "Blockchain", "OpenSource", "SocialMedia", "InformationWar", "Summit", "CommonLand", "lab", "EmptyPollution", "PictureBook", "HealthCare", "PublicOpinion", "Society", "Earthquake", "NewResidents", "Corrections", "UrbanPlanning", "Backup", "HumanRights",
        "Corruption", "AI", "Industry", "Referendum", "voting", "epidemic"];
    var str = "";
    for (var i = 0; i < 3; i++) {
        str += taglist[Math.floor(Math.random() * taglist.length)];
    }
    return str;
}
/*
var randomString = function(len) {
  var $chars = "abcdefghijklmnopqrstuvwxyz1234567890";
  var maxPos = $chars.length;
  var pwd = "";
  for (var i = 0; i < len; i++ ) {
    pwd += $chars.charAt(Math.floor(Math.random() * maxPos));
  }
  return pwd;
}*/

$(function () {
    $("#login-url").attr("value", "https://meet.jit.si/" + randomString(10));
    var loading_promises = [];
    $.get(scene_config, function (loading_scenes) {
        for (let loading_scene of loading_scenes) {
            loading_promises.push($.get(get_absolute_url(scene_config, loading_scene.path)).then(function (text) {
                default_data.scenes[loading_scene.id] = {
                    name: loading_scene.name,
                    content: text,
                }
            }));
        }
        Promise.all(loading_promises).then(function () {
            var temp_current_data_scenes = JSON.parse(localStorage.getItem('current_data'));
            var temp_data = JSON.parse(JSON.stringify(default_data));
            if (temp_current_data_scenes != null) {
                temp_data.scenes = temp_current_data_scenes;
            }
            load_data(temp_data);
        });
    }, 'json');

});

$('#resize-form [name="preview-user"]').change(function () {
    var win = $('#preview-iframe')[0].contentWindow;
    var v = parseInt($(this).val());
    if (v > preview_fake_users.length) {
        preview_fake_counter++;
        preview_fake_users.push(preview_fake_counter);
        win.Jitsi.fire('user_joined', { id: preview_fake_counter, name: 'User-' + preview_fake_counter });
    } else {
        for (i = preview_fake_users.length; i > v; i--) {
            var idx = Math.floor(Math.random() * preview_fake_users.length);
            var deleted_user = preview_fake_users[idx];
            preview_fake_users = preview_fake_users.slice(0, idx).concat(preview_fake_users.slice(idx + 1));
            win.Jitsi.fire('user_left', { id: deleted_user, name: 'User-' + deleted_user });
        }
    }
});

var preview_fake_counter = 0;
var preview_fake_users = [];

var update_preview_video = function () {
    $('.video-box', $('#preview-iframe')[0].contentDocument).each(function () {
        var id = $(this).attr('data-id');
        if ('undefined' === typeof (id)) {
            id = 'U' + $(this).attr('data-user');
        }

        $(this).html('');
        // draw fake video
        var canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 450;
        var ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, 800, 450);
        ctx.textAlign = 'center';
        ctx.fillStyle = 'white';
        ctx.font = 'normal 100px Arial';

        var metric = ctx.measureText(id);
        text_height = metric.actualBoundingBoxAscent + metric.actualBoundingBoxDescent;

        ctx.strokeStyle = 'green';
        for (var x = -canvas.height; x < canvas.width; x += 50) {
            ctx.moveTo(x, 0);
            ctx.lineTo(x + canvas.height, canvas.height);
            ctx.stroke();

            ctx.moveTo(canvas.width - x, 0);
            ctx.lineTo(canvas.width - x - canvas.height, canvas.height);
            ctx.stroke();
        }

        ctx.strokeStyle = 'yellow';
        ctx.moveTo(0, 0);
        ctx.lineTo(canvas.width, 0);
        ctx.lineTo(canvas.width, canvas.height);
        ctx.lineTo(0, canvas.height);
        ctx.lineTo(0, 0);
        ctx.stroke();

        var row = 0;
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 4;
        ctx.fillStyle = 'white';
        ctx.strokeText(id, canvas.width / 2, canvas.height / 2 + text_height / 2);
        ctx.fillText(id, canvas.width / 2, canvas.height / 2 + text_height / 2);

        var width = canvas.width;
        var height = canvas.height;

        var body_width = $(this)[0].scrollWidth;
        var body_height = $(this)[0].scrollHeight;

        var ratio = width / height;
        var actual_width, actual_height;
        if (body_height == 0 || body_height * ratio > body_width) {
            actual_width = body_width;
            actual_height = Math.floor(body_width / ratio);
        } else {
            actual_width = Math.floor(body_height * ratio);
            actual_height = body_height;
        }
        var canvas_dom = $(canvas);
        canvas_dom.css({
            position: 'relative',
            width: actual_width,
            height: actual_height,
        });

        $(this).append(canvas_dom);
    });
};

var update_preview_content = function (content) {
    //editor.setData(content);
    var scene_id = $("#preview-iframe").data('scene_id');
    var screen_id = $("#preview-iframe").data('screen_id');
    $("#preview-html textarea").val(content);
    $("#preview-html [name='scene-title']").val(current_data.scenes[scene_id].name);
    var preview_fake_user = parseInt($('#resize-form [name="preview-user"]').val());
    preview_fake_users = [];
    for (var i = 0; i < preview_fake_user; i++) {
        preview_fake_counter++;
        preview_fake_users.push(preview_fake_counter);
    }
    init_win_env($('#preview-iframe')[0].contentWindow, screen_id == undefined, function () { }, 0);
    $('#preview-iframe')[0].contentDocument.open();
    $('#preview-iframe')[0].contentDocument.write(content);
    $('#preview-iframe')[0].contentDocument.close();
    $('#preview-iframe').contents().find('html').css('overflow', 'hidden');
    $("#card-scene-preview .card-header span").text("｜" + current_data.scenes[scene_id].name);
    update_preview_size();
    if (screen_id != undefined) {
        update_videos($('#preview-iframe')[0].contentWindow, screen_id, true);
    }
    else {
        update_preview_video();
    }
};

$('#btn-scene-editor-save').click(function (e) {
    var scene_id = $("#preview-iframe").data('scene_id');
    var screen_id = $("#preview-iframe").data('screen_id');
    console.log("screen_id: " + screen_id + " scene_id: " + scene_id);
    if (screen_id == undefined) {
        var title = $("#preview-html [name='scene-title']").val();
        var content = $('#preview-html textarea').val();
        current_data.scenes[scene_id].name = title;
        current_data.scenes[scene_id].content = content;
        $("#card-scene-preview .card-header span").text("｜" + title);
        $($('a.scene-list-title')[scene_id - 1]).text(title);
        localStorage.setItem('current_data', JSON.stringify(current_data.scenes));
    }
    else {
        var content = $('#preview-html textarea').val();
        current_data.screens[screen_id].content = content;
    }
    current_data.version = (new Date).getTime();
});

var event_listener = function (event, screen_id, values) {
    if (event == 'action_add') {
        var action_box = $('#screen-choose-body-' + screen_id + ' .action-box');
        action_box.html('');

        for (var name in values) {
            var form_dom = $('<form></form>');
            form_dom.append($('<span></span>').text(name));
            form_dom.append($('<button type="submit" class="btn btn-dark">Action</button>'));
            form_dom.data('action_values', values[name]);
            form_dom.data('action_name', name);
            form_dom.on('submit', function (e) {
                e.preventDefault();
                if (room) {
                    room.broadcastEndpointMessage({
                        type: 'run_action', message: {
                            screen_id: screen_id,
                            action_name: $(this).data('action_name'),
                            params: [],
                        }
                    });
                }
                var win = windows[screen_id];
                if (win.closed) {
                    return;
                }
                win.Jitsi.runAction($(this).data('action_name'), []);
            });
            action_box.append(form_dom);
        }
    }
};

var update_screen_data = function () {
    $('#screen-list').html('');
    for (var idx in current_data.screens) {
        var screen = current_data.screens[idx];
        var title = '畫面 ' + idx;
        if (screen.title) {
            title += ' : ' + screen.title;
        } else {
            title += ' : ' + current_data.scenes[screen.scene_id].name;
        }
        var item_dom = $($('#tmpl-screen-list-item').html()).text(title);
        item_dom.attr('id', 'screen-item-' + idx);
        $('#screen-list').append(item_dom);
    }
};

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

$('#form-screen-new').submit(function (e) {
    e.preventDefault();
    var scene_id = $("#preview-iframe").data('scene_id');
    if (scene_id == null || scene_id == undefined) {
        return;
    }
    var title = $('[name="title"]', this).val();
    /*var width = parseInt($('[name="width"]', this).val());
    var height = parseInt($('[name="height"]', this).val());*/
    var width = parseInt($('#resize-form [name="width"]').val());
    var height = parseInt($('#resize-form [name="height"]').val());
    var user_select = {};
    var content = current_data.scenes[scene_id].content;
    var name = current_data.scenes[scene_id].name;
    $('#form-screen-new .user-select').each(function () {
        user_select[$(this).data('id')] = $(this).val();
    });

    var idx = current_data.screens.length;

    $("#preview-iframe").data('screen_id', idx);

    current_data.screens.push({
        scene_id: scene_id,
        title: title,
        name: name,
        width: width,
        height: height,
        content: content,
        viewers: $('#form-screen-new .btn-delete-viewer').map(function (a) { return $(this).data('viewer'); }).toArray(),
        user_select: user_select,
    });
    var div_dom = $($('#tmpl-screen-choose-body').html());
    $('.scene-chooser', div_dom).text(current_data.scenes[scene_id].name);
    $('.screen-title', div_dom).text(title);
    $('[name="width"]', div_dom).val(width);
    $('[name="height"]', div_dom).val(height);
    var user_list = get_list_from_content(current_data.scenes[scene_id].content);
    $('.custom-box', div_dom).append('<div>推送：<span class="viewer-list"></span><span class="add-viewer-block"></span></div>');
    current_data.screens[idx].viewers.map(function (viewer) {
        $('.viewer-list', div_dom).append($('<button class="btn btn-dark"></button>').addClass('btn-delete-viewer').data('viewer', viewer).text("關閉推送"));
    });
    var viewer_dom = $('<select></select>').addClass('viewer-select').addClass('d-none');
    viewer_dom.append($('<option></option>').attr('value', 'default-預設').text('預設'));
    $('.custom-box .add-viewer-block', div_dom).append(viewer_dom);
    $('.custom-box .add-viewer-block', div_dom).append($('<button class="btn-add-viewer btn btn-dark">推送畫面</button>'));
    user_list.map(function (id) {
        $('.custom-box', div_dom).append($('<span></span>').text('User ' + id + '：'));
        $('.custom-box', div_dom).append($('<select></select>').addClass('user-select').addClass('new').data('id', id).addClass('user-select-' + id));
        $('.custom-box', div_dom).append('<br>');
    });
    div_dom.attr('id', 'screen-choose-body-' + idx).data('screen_id', idx).data('scene_id', scene_id);

    $('#screen-choose-body-area').append(div_dom);
    $('#card-screen-settings .card-header span').text('畫面 ' + idx + ' ' + title);
    update_user_list();

    user_list.map(function (id) {
        $('.user-select-' + id, div_dom).each(function () {
            $(this).val('none');
        });
    });

    $('#screen-choose-body-area .screen-choose-body').hide();
    $('.btn-focus', div_dom).hide();
    div_dom.show();
    update_screen_data();
    $('.screen-item').removeClass('active');
    $('#screen-item-' + idx).addClass('active');

    var scene = current_data.screens[idx];
    $("#preview-iframe").data('screen_id', idx);
    update_preview_content(scene.content);
});

$('#viewer-url-copy').on('click', function () {
    var copyText = document.getElementById("viewer-url");
    copyText.select();
    copyText.setSelectionRange(0, 99999)
    document.execCommand("copy");
    alert("已複製觀眾網址");
});

$('#screen-choose-body-area').on('click', '.btn-focus', function (e) {
    e.preventDefault();
    var idx = $(this).parents('.screen-choose-body').attr('id').split('-')[3];
    windows[idx].focus();
});

$('#screen-choose-body-area').on('click', '.btn-reupdate', function (e) {
    e.preventDefault();
    var idx = $(this).parents('.screen-choose-body').attr('id').split('-')[3];

    if (windows[idx] != undefined) {
        windows[idx].document.body.innerHTML = '';
        windows[idx].document.write(current_data.screens[idx].content);
        windows[idx].Jitsi.reload();
    }
});

$('#screen-choose-body-area').on('change', '[name="title"]', function (e) {
    e.preventDefault();
    var idx = $(this).parents('.screen-choose-body').attr('id').split('-')[3];
    var title = $(this).val();
    if (title) {
        windows[idx].document.title = '畫面 ' + title;
    } else {
        windows[idx].document.title = '畫面 ' + idx;
    }
});

$('#btn-preview-pop').on('click', function (e) {
    e.preventDefault();
    var width = parseInt($('#resize-form [name="width"]').val());
    var height = parseInt($('#resize-form [name="height"]').val());
    var idx = $("#preview-iframe").data('screen_id');
    if (idx == undefined) {
        return;
    }
    var win = window.open('', '預覽', config = 'menubar=no,status=no,toolbar=no,height=' + height + ',width=' + width);

    check_resize(win, width, height);
    init_win_env(win, false, event_listener, idx);
    win.document.open();
    win.document.write(current_data.screens[idx].content);
    win.onunload = function () {
        $('#btn-preview-pop').show();
    };
    $('#btn-preview-pop').hide();
    win.onunload = function () {
        $('#btn-preview-pop').show();
        win._isUnloading = true;
        auto_detach_track();
    };
    $(win.document.body).css('overflow', 'hidden');
    $(win.document.body).css('margin', 0);
    $('.video-box', win.document).ready(function () {
        update_screen_video();
    });
    preview_window = win;
});

$('#screen-choose-body-area').on('click', '.btn-reopen', function (e) {
    e.preventDefault();
    var idx = $(this).parents('.screen-choose-body').attr('id').split('-')[3];
    var width = parseInt($('#screen-choose-body-' + idx + ' [name="width"]').val());
    var height = parseInt($('#screen-choose-body-' + idx + ' [name="height"]').val());
    console.log(width + "/" + height);
    /*width = current_data.screens[idx].width;
    height = current_data.screens[idx].height;*/
    scene_id = current_data.screens[idx].scene_id;
    var win = window.open('', 'screen-' + idx, config = 'menubar=no,status=no,toolbar=no,height=' + height + ',width=' + width);
    check_resize(win, width, height);
    init_win_env(win, false, event_listener, idx);
    win.document.open();
    win.document.write(current_data.screens[idx].content);
    if (current_data.screens[idx].title) {
        win.document.title = '畫面 ' + current_data.screens[idx].title;
    } else {
        win.document.title = '畫面 ' + idx;
    }
    win.onunload = function () {
        $('#screen-choose-body-' + idx + ' .btn-reopen').show();
        $('#screen-choose-body-' + idx + ' .btn-focus').hide();
    };
    $('#screen-choose-body-' + idx + ' .btn-reopen').hide();
    $('#screen-choose-body-' + idx + ' .btn-focus').show();
    win.onunload = function () {
        $('#screen-choose-body-' + idx + ' .btn-reopen').show();
        $('#screen-choose-body-' + idx + ' .btn-focus').hide();
        win._isUnloading = true;
        auto_detach_track();
    };
    $(win.document.body).css('overflow', 'hidden');
    $(win.document.body).css('margin', 0);
    $('.video-box', win.document).ready(function () {
        update_screen_video();
    });
    windows[idx] = win;
});

$('#btn-screen-choose-add').click(function (e) {
    e.preventDefault();
    $('#screen-choose-body-area .screen-choose-body').hide();
    $('.screen-item').removeClass('active');
    $('#card-screen-settings .card-header span').text("新增畫面");
    $('#screen-choose-body-new').show();
});


$('#btn-scene-choose-add').click(function (e) {
    e.preventDefault();
    var new_id = 1;
    for (; new_id <= Object.keys(current_data.scenes).length + 1; new_id++) {
        if (current_data.scenes[new_id] == null) {
            break;
        }
    }
    var scenes_new = {
        name: `new scene${new_id}`,
        content: "<h1>new scene</h1>",
    };
    current_data.scenes[new_id] = scenes_new;
    var li_dom = $('<li><div><a class="scene-list-title"></a></div></li>');
    $(".scene-list-title", li_dom).text(scenes_new.name);
    $("div", li_dom).append($('<button></button>').text('選擇模板').addClass('btn btn-dark btn-sm btn-preview'));
    $("div", li_dom).append($('<button></button>').html('<i class="fas fa-trash-alt"></i>').addClass('btn btn-danger btn-sm btn-delete-scene'));
    li_dom.data('id', new_id);
    $('#scene-list').append(li_dom);
});

$('#btn-scene-choose-export').click(function (e) {
    e.preventDefault();
    var a = document.createElement("a");
    var data = current_data.scenes;
    document.body.appendChild(a);
    a.style = "display: none";

    var json = JSON.stringify(data),
        blob = new Blob([json], { type: "text/plain;charset=utf-8" }),
        url = window.URL.createObjectURL(blob);
    a.href = url;
    a.download = "screen-helper.json";
    a.click();
    window.URL.revokeObjectURL(url);
});

$('#btn-scene-choose-import').click(function (e) {
    e.preventDefault();
    $('#scene-file-input').click();
});

$('#scene-file-input').on('change', function (e) {
    var file = e.target.files[0];
    if (!file) {
        return;
    }
    var reader = new FileReader();
    reader.onload = function (e) {
        var contents = e.target.result;
        var temp_data = JSON.parse(JSON.stringify(default_data));
        temp_data.scenes = JSON.parse(contents);
        load_data(temp_data);
    };
    reader.readAsText(file);
});

$('#btn-editor-add-video').click(function (e) {
    e.preventDefault();
    var id_list = get_list_from_content($('#preview-html textarea').val());
    var i = 1;
    for (; i <= id_list.length; i++) {
        if (id_list[i - 1] != i) {
            break;
        }
    }
    $('#preview-html textarea').val($('#preview-html textarea').val() + `\n<div class="video-box" data-id="${i}" data-select="true"></div>`);
});

$('#screen-list').on('click', '.screen-item', function (e) {
    e.preventDefault();
    $('#screen-choose-body-area .screen-choose-body').hide();
    $('.screen-item').removeClass('active');
    var idx = $(this).attr('id').split('-')[2];
    $('#screen-choose-body-' + idx).show();
    $('#card-screen-settings .card-header span').text($(this).text());
    $(this).addClass('active');

    var scene_id = $('#screen-choose-body-' + idx).data('scene_id');
    var scene = current_data.screens[idx];
    $("#preview-iframe").data('screen_id', idx);
    update_preview_content(scene.content);
});

$('#scene-list').on('click', '.btn-preview', function (e) {
    e.preventDefault();
    $("#preview-iframe").removeData('screen_id');

    $('#screen-choose-body-area .screen-choose-body').hide();
    $('.screen-item').removeClass('active');
    $('#card-screen-settings .card-header span').text("新增畫面");
    $('#screen-choose-body-new').show();

    var scene_id = $(this).parents('li').data('id');
    var scene = current_data.scenes[scene_id];
    $("#preview-iframe").data('scene_id', scene_id);
    update_preview_content(scene.content);
});

$('#scene-list').on('click', '.btn-delete-scene', function (e) {
    e.preventDefault();
    var scene_id = $(this).parents('li').data('id');
    var scene = current_data.scenes[scene_id];
    if (confirm("確認刪除模板「" + scene.name + "」？")) {
        $(this).parents('li').remove();
        delete current_data.scenes[scene_id];
        localStorage.setItem('current_data', JSON.stringify(current_data.scenes));
    } else {
        return;
    }
});

var update_preview_size = function () {
    if ($('#preview-iframe').contents().find('body').width() == null) {
        setTimeout(function () { update_preview_size(); }, 100);
        return;
    }
    var width = parseInt($('#resize-form [name="width"]').val());
    var height = parseInt($('#resize-form [name="height"]').val());

    var body_width = $('#card-scene-preview .card-body')[0].scrollWidth;
    var body_height = $('#card-scene-preview .card-body')[0].scrollHeight;

    var ratio = width / height;
    var actual_width, actual_height;

    if (body_height * ratio > body_width) {
        actual_width = body_width;
        actual_height = body_width / ratio;
    } else {
        actual_width = body_height * ratio;
        actual_height = body_height;
    }
    $('#preview-iframe').width(actual_width);
    $('#preview-iframe').height(actual_height);
    $('#preview-iframe').contents().find('body').css('zoom', actual_width / width).css('margin', 0);
};

$('#resize-form').submit(function (e) {
    e.preventDefault();
    var temp_content = $("#preview-html textarea").val();
    update_preview_content(temp_content);
});

var matches = location.search.match(/\?url=(.*)/);
if (matches) {
    $('[name="url"]').val(decodeURIComponent(matches[1]));
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

$('#jitsi-form').submit(function (e) {
    e.preventDefault();
    var matches = $('[name="url"]').val().match('^https://([^/]*)/(.*)$');
    if (!matches) {
        alert('網址不正確');
        return;
    }

    jitsi_domain = matches[1];
    jitsi_room = matches[2].toLowerCase();
    console.log("jitsi domain: " + jitsi_domain);
    $.getScript("//" + jitsi_domain + "/libs/lib-jitsi-meet.min.js")
        .done(function (script, textStatus) {
            $("#section-login").addClass("d-none");
            $("#section-main").removeClass("d-none");
            $("#section-main .bot-name").text("Bot: " + $('#jitsi-form [name="bot-name"]').val());
            window.history.pushState('', '', '?url=' + encodeURIComponent(matches[0]));

            JitsiMeetJS.setLogLevel(JitsiMeetJS.logLevels.INFO);
            JitsiMeetJS.init(initOptions);
            const options = {
                hosts: {
                    domain: jitsi_domain,
                    muc: 'conference.' + jitsi_domain,
                },
                serviceUrl: 'wss://' + jitsi_domain + '/xmpp-websocket',
                // The name of client node advertised in XEP-0115 'c' stanza
                clientNode: 'http://jitsi.org/jitsimeet'
            };
            options.serviceUrl += '?room=' + jitsi_room;
            connection = new JitsiMeetJS.JitsiConnection(null, null, options);
            connection.addEventListener(JitsiMeetJS.events.connection.CONNECTION_ESTABLISHED, onConnected);
            connection.addEventListener(JitsiMeetJS.events.connection.CONNECTION_FAILED, function () { alert('連線失敗'); });
            JitsiMeetJS.mediaDevices.addEventListener(
                JitsiMeetJS.events.mediaDevices.DEVICE_LIST_CHANGED,
                onDeviceListChanged);

            if ($('[name="password"]').val()) {
                id = $('[name="id"]').val();
                if(id.indexOf("@") == -1) {
                    id+="@"+jitsi_domain;
                }
                connection.connect({
                    id: id,
                    password: $('[name="password"]').val(),
                });
            } else {
                connection.connect();
            }
        })
        .fail(function (jqxhr, settings, exception) {
            alert("failed to get library");
        });
});

$('#screen-choose-body-area').on('click', '.btn-add-viewer', function (e) {
    e.preventDefault();
    $('.btn-add-viewer').show();
    $(this).hide();
    var box_dom = $(this).parents('.custom-box');
    var viewer = $('.viewer-select', box_dom).val();
    for (var i = 0; i < $('.btn-delete-viewer', box_dom).length; i++) {
        if ($('.btn-delete-viewer', box_dom).eq(i).data('viewer') == viewer) {
            // viewer has been added, skip
            return;
        }
    }
    $('.viewer-list', box_dom).append($('<button class="btn btn-dark"></button>').addClass('btn-delete-viewer').data('viewer', viewer).text("關閉推送"));
    var screen_id = $(this).parents('.screen-choose-body').data('screen_id');
    if ('undefined' === typeof (screen_id)) {
        return;
    }
    for (var checking_screen_id in current_data.screens) {
        if (checking_screen_id == screen_id) {
            continue;
        }
        if (current_data.screens[checking_screen_id].viewers.indexOf(viewer) >= 0) {
            $('#screen-choose-body-' + checking_screen_id + ' .btn-delete-viewer').each(function () {
                if ($(this).data('viewer') == viewer) {
                    $(this).remove();
                }
            });
            current_data.screens[checking_screen_id].viewers = $('#screen-choose-body-' + checking_screen_id + ' .btn-delete-viewer').map(function (a) { return $(this).data('viewer'); }).toArray()
        }
    }
    current_data.screens[screen_id].viewers = $('.btn-delete-viewer', box_dom).map(function (a) { return $(this).data('viewer'); }).toArray()
    current_data.version = (new Date).getTime();
    if (room) {
        console.log('broadcast scenes to all viewers');
        room.setLocalParticipantProperty('scene_version', current_data.version);
        room.broadcastEndpointMessage({ type: 'update_scene', message: get_scene_data(), host_id: getHostId() });
    }
});

var get_scene_data = function () {
    var scenes = {};
    for (var screen_id in current_data.screens) {
        if (current_data.screens[screen_id].viewers.length) {
            scenes[current_data.screens[screen_id].scene_id] = current_data.scenes[current_data.screens[screen_id].scene_id];
        }
    }

    if (Object.keys(scenes).length == 0) { // fake scene
        return {
            current_data: {
                scenes: {
                },
                screens: [
                ],
                version: 0
            }
        }
    }
    else
        return {
            current_data: {
                screens: current_data.screens,
                scenes: scenes,
                version: current_data.version,
            }
        };
};

$('#screen-choose-body-area').on('click', '.btn-delete-viewer', function (e) {
    e.preventDefault();
    var box_dom = $(this).parents('.custom-box');
    var screen_id = $(this).parents('.screen-choose-body').data('screen_id');
    var deleting_viewer = $(this).data('viewer');
    $(this).remove();
    $(".btn-add-viewer").show();
    if ('undefined' === typeof (screen_id)) {
        return;
    }
    current_data.screens[screen_id].viewers = $('.btn-delete-viewer', box_dom).map(function (a) { return $(this).data('viewer'); }).toArray();
    current_data.version = (new Date).getTime();
    if (room) {
        room.setLocalParticipantProperty('scene_version', current_data.version);
        room.broadcastEndpointMessage({ type: 'update_scene', message: get_scene_data() });
    }
});

$('#screen-choose-body-area').on('change', '.user-select', function (e) {
    var screen_choose_body_dom = $(this).parents('.screen-choose-body');
    var screen_id = screen_choose_body_dom.data('screen_id');
    if ('undefined' === typeof (screen_id)) {
        return;
    }

    $('.user-select', screen_choose_body_dom).each(function () {
        current_data.screens[screen_id].user_select[$(this).data('id')] = $(this).val();
    });

    current_data.version = (new Date).getTime();
    if (room && current_data.screens[screen_id].viewers.length > 0) {
        room.setLocalParticipantProperty('scene_version', current_data.version);
        room.broadcastEndpointMessage({ type: 'update_scene', message: get_scene_data() });
    }
    update_screen_video();
});

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

var update_videos = function (win, idx, isPreview = false) {
    var user_select = current_data.screens[idx].user_select;
    $('.video-box', win.document).each(function () {
        user_id = user_select[$(this).attr('data-id')];
        if ('undefined' === typeof (user_id)) {
            user_id = $(this).attr('data-user');
        }
        if ('undefined' === typeof (user_id) || 'undefined' === typeof (room.participants[user_id])) {
            return;
        }
        if (!$('video', this).length) {
            $(this).append($('<video style="width: 100%; height: 100%; border: 0; margin: 0; padding: 0; display: none" autoplay="1" muted></video>'));
            $(this).addClass('no-video');
        }
        if (!isPreview && !$(`#audio-${user_id}`).length && !$(`#screen-choose-body-${idx} .set-mute`).is(":checked")) {
            var audio_dom = $('<audio autoplay="1"></audio>').attr('id', 'audio-' + user_id);
            $("#audio-pool").append(audio_dom);
            audio_track = room.participants[user_id].getTracksByMediaType('audio')[0];
            if (audio_track && audio_dom) {
                audio_track.attach(audio_dom[0]);
            }
        }
        var video_dom = $('video', this);
        var user_name = "none";
        $(this).attr('data-result-user', user_id);
        if ('undefined' === typeof (user_id) || user_id == 'none') {
            var old_track = video_dom[0].__track;
            if (old_track) {
                video_detach(this, old_track);
            }
        } else if (user_id == 'viewer') {
            user_name = "{viewer_name}";
            var track = room.getLocalVideoTrack();
            var old_track = video_dom[0].__track;
            if (old_track) {
                video_detach(this, old_track);
            }
            if (track) {
                video_attach(this, track);
            }
        } else if (user_id.match && user_id.match(/^camera-/)) {
            var device_id = user_id.split('-')[1];
            get_local_video_track(device_id, function (track) {
                var old_track = video_dom[0].__track;
                if (old_track) {
                    video_detach(this, old_track);
                }
                video_attach(this, track);
            });
        } else {
            if (user_id == room.myUserId()) {
                user_name = room.myName;
                var track = room.getLocalVideoTrack();
                var tracks = [];
                if ('undefined' !== typeof (track)) {
                    tracks.push(track);
                }
            } else if ('undefined' !== typeof (room.participants[user_id])) {
                user_name = room.participants[user_id].getDisplayName();
                var tracks = room.participants[user_id].getTracksByMediaType('video');
            } else {
                var old_track = video_dom[0].__track;
                if (old_track) {
                    video_detach(this, old_track);
                }
                old_track = audio_dom[0].__track;
                if (old_track) {
                    audio_detach(this, old_track);
                }
                return;
            }

            var old_track = video_dom[0].__track;
            if (old_track && (tracks.length == 0 || old_track.ssrc != tracks[0].ssrc || old_track.deviceId != tracks[0].deviceId)) {
                video_detach(this, old_track);
            }
            if (tracks.length) {
                if (!old_track || old_track.ssrc != tracks[0].ssrc || old_track.deviceId != tracks[0].deviceId) {
                    video_attach(this, tracks[0]);
                }
                if ($(this).attr('data-select') == 'true') {
                    selected_users[user_id] = 'select';
                }
            }
        }
        $('username', $(this)).text(user_name);
    });
    win.Jitsi.fire('user_box_updated', {});
}

var update_screen_video = function () {
    auto_detach_track();
    for (var id in selected_users) {
        if (selected_users[id] == 'select') {
            delete (selected_users[id]);
        }
    }
    $("#audio-pool").html("");
    var screen_id = $("#preview-iframe").data('screen_id');
    if (screen_id != undefined) {
        update_videos($('#preview-iframe')[0].contentWindow, screen_id, true);
        if (preview_window != null) {
            update_videos(preview_window, screen_id, true);
        }
    }
    for (var idx in windows) {
        var win = windows[idx];
        if (win.closed) {
            continue;
        }
        update_videos(win, idx);
    }
    reselected_users();
};
$('#screen-choose-body-area').on('click', '.set-mute', function (e) {
    update_screen_video();
});

$('[name="bot-name"]').change(function () {
    $("#section-main .bot-name").text("Bot: " + $(this).val());
    if (room) {
        room.myName = $(this).val();
        room.setDisplayName(room.myName);
    }
});

var update_user_list = function () {
    $('#user-list').html('');
    var tr_dom = $('<tr></tr>');
    tr_dom.append($('<td class="user-name"></td>').append($('<span class="user-list-name"></span>').text('[me]' + $('[name="bot-name"]').val())).append($('<div class="audiolevel-area"></div>')));
    var td_dom = $('<td></td>');
    if (room) {
        tr_dom.attr('id', 'user-list-' + room.myUserId());
    } else {
        tr_dom.attr('id', 'user-list-me');
    }
    td_dom.append($('<i class="fas microphone-stat"></i>'));
    td_dom.append($('<i class="fas video-stat fa-video"></i>'));
    tr_dom.append(td_dom);

    if (!room || !room.getLocalAudioTrack()) {
        $('.microphone-stat', td_dom).addClass('fa-microphone-alt-slash');
    } else {
        $('.microphone-stat', td_dom).addClass('fa-microphone-alt');
    }
    if (!room || !room.getLocalVideoTrack()) {
        $('.video-stat', td_dom).addClass('fa-video-slash');
    } else {
        $('.video-stat', td_dom).addClass('fa-video');
    }

    $('#user-list').append(tr_dom);

    $('.user-select').each(function () {
        var current_user = null;
        if (!$(this).is('.new')) {
            current_user = $(this).val();
        } else {
            $(this).removeClass('new');
        }

        $(this).html('');
        option_dom = $('<option></option>');
        option_dom.html('不顯示').val('none');
        $(this).append(option_dom);

        option_dom = $('<option></option>');
        option_dom.text('viewer').val('viewer');
        $(this).append(option_dom);

        if (room) {
            option_dom = $('<option></option>');
            option_dom.html(room.myUserId() + '. Me').val(room.myUserId());
            $(this).append(option_dom);
            for (var id in room.participants) {
                var option_dom = $('<option></option>');
                option_dom.html(id + '. ' + room.participants[id].getDisplayName()).val(id);
                $(this).append(option_dom);
            }
        }

        if (null !== current_user) {
            $(this).val(current_user);
        }
    });

    if (room) {
        for (var id in room.participants) {
            var tr_dom = $('<tr></tr>');
            tr_dom.attr('id', 'user-list-' + id);
            tr_dom.append($('<td class="user-name"></td>').append($('<span class="user-list-name"></span>').text(room.participants[id].getDisplayName())).attr('title', id).append($('<div class="audiolevel-area"></div>')));
            var td_dom = $('<td></td>');
            td_dom.append($('<i class="fas microphone-stat"></i>'));
            td_dom.append($('<i class="fas video-stat fa-video"></i>'));
            tr_dom.append(td_dom);
            audio_track = room.participants[id].getTracksByMediaType('audio')[0];
            if (!audio_track || audio_track.muted) {
                $('.microphone-stat', td_dom).addClass('fa-microphone-alt-slash');
            } else {
                $('.microphone-stat', td_dom).addClass('fa-microphone-alt');
            }
            var audio_dom = $(`#audio-${id}`)[0];
            if (audio_dom && audio_dom.muted) {
                $('.microphone-stat', td_dom).addClass('disable');
            }

            video_track = room.participants[id].getTracksByMediaType('video')[0];
            if (!video_track || video_track.muted) {
                $('.video-stat', td_dom).addClass('fa-video-slash');
            } else {
                $('.video-stat', td_dom).addClass('fa-video');
            }
            $('#user-list').append(tr_dom);
        }
    }
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
    $(`#user-list-${room.myUserId()} .microphone-stat`).removeClass('fa-microphone-alt').addClass('fa-microphone-alt-slash');

    Promise.all(promises).then(function () {
        if ('none' == id) {
        } else {
            get_local_audio_track(id, function (track) {
                $(`#user-list-${room.myUserId()} .microphone-stat`).removeClass('fa-microphone-alt-slash').addClass('fa-microphone-alt');
                track.unmute();
                room.addTrack(track);
            });
        }
    });
});

$('#output-video').change(function () {
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
                    $('#output-audio').append($('<option></option>').attr('value', device.deviceId).text(device.label));
                    has_audio = true;
                    device_list.audio.push(device);
                }
                if (device.kind == 'videoinput' && device.label != '') {
                    $('#output-video').append($('<option></option>').attr('value', device.deviceId).text(device.label));
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
    update_user_list();
};

var getHostId = function () {
    var host_id = localStorage.getItem('host_id');
    if (!host_id) {
        host_id = Math.floor(Math.random() * 100000000);
        localStorage.setItem('host_id', host_id);
    }
    return host_id;
};

var onConnected = function () {
    var confOptions = {
        openBridgeChannel: 'websocket',
        confID: jitsi_domain + '/' + jitsi_room
    };

    $('#logined-area').show();
    var jitsi_room_url = 'https://' + jitsi_domain + '/' + jitsi_room;
    $('#jitsi-url').html(`<a href="${jitsi_room_url}" target="_blank">${jitsi_room_url}</a>`);
    var host_id = getHostId();
    $('#viewer-url').val((new URL('./viewer.html', document.location)).href + '?host_id=' + host_id + '&jitsi_room_url=' + encodeURIComponent(jitsi_room_url));
    $('#logined-area [name="bot-name"]').val($('#jitsi-form [name="bot-name"]').val());
    update_devices();

    room = connection.initJitsiConference(jitsi_room, confOptions);
    room.myName = $('#jitsi-form [name="bot-name"]').val();
    room.setDisplayName($('#jitsi-form [name="bot-name"]').val());
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
            update_user_list();

            room.on(JitsiMeetJS.events.conference.ENDPOINT_MESSAGE_RECEIVED, (participant, message) => {
                if (message.type == 'request_scene') {
                    if (message.host_id != getHostId()) {
                        return;
                    }
                    console.log('User ' + participant.getId() + ' requested scenes, responsed');
                    room.sendEndpointMessage(participant.getId(), { type: 'response_scene', message: get_scene_data(), host_id: getHostId() });
                }
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
            room.on(JitsiMeetJS.events.conference.PARTICIPANT_PROPERTY_CHANGED, (user, text, ts) => {
                var id = user.getId();
                for (var idx in windows) {
                    windows[idx].Jitsi.fire('property_changed', { id: id, text: text });
                }
            });
            room.on(JitsiMeetJS.events.conference.MESSAGE_RECEIVED, (id, text, ts) => {
                message_logs.push({ id: id, text: text, ts: ts });
                for (var idx in windows) {
                    windows[idx].Jitsi.fire('message_received', { id: id, text: text, ts: ts });
                }
            });
            room.on(JitsiMeetJS.events.conference.USER_JOINED, (id, user) => {
                if (!$(`#audio-${id}`).length) {
                    var audio_dom = $('<audio autoplay="1"></audio>').attr('id', 'audio-' + id);
                    $('#audio-pool').append(audio_dom);
                }
                for (var idx in windows) {
                    windows[idx].Jitsi.fire('user_joined', { id: id, name: user.getDisplayName() });
                }
                update_user_list();
            });
            room.on(JitsiMeetJS.events.conference.USER_LEFT, (id, user) => {
                for (var idx in windows) {
                    windows[idx].Jitsi.fire('user_left', { id: id, name: user.getDisplayName() });
                }
                update_user_list();
            });
            room.on(JitsiMeetJS.events.conference.DISPLAY_NAME_CHANGED, (id, name) => {
                for (var idx in windows) {
                    windows[idx].Jitsi.fire('display_name_changed', { id: id, name: name });
                }
                update_user_list();
            });
            room.on(JitsiMeetJS.events.conference.TRACK_ADDED, (track) => {
                if (track.type == 'audio' && track.ownerEndpointId && $('#audio-' + track.ownerEndpointId).length) {
                    //track.attach($('#audio-' + track.ownerEndpointId)[0]);                    
                }
                for (var idx in windows) {
                    windows[idx].Jitsi.fire('track_added', { track: track });
                }
                update_user_list();
            });
            room.on(JitsiMeetJS.events.conference.TRACK_REMOVED, (track) => {
                if (track.type == 'audio' && track.ownerEndpointId && $('#audio-' + track.ownerEndpointId).length) {
                    track.detach($('#audio-' + track.ownerEndpointId)[0]);
                }
                for (var idx in windows) {
                    windows[idx].Jitsi.fire('track_removed', { track: track });
                }
                update_user_list();
            });
            room.on(JitsiMeetJS.events.conference.TRACK_MUTE_CHANGED, (track) => {
                update_user_list();
            });
            room.on(JitsiMeetJS.events.conference.TRACK_AUDIO_LEVEL_CHANGED, level_changed);
        });

    room.setLocalParticipantProperty('jitsi-screen', true);
    if ($('[name="password"]').val()) {
        room.join($('[name="password"]').val());
    } else {
        room.join();
    }
}

var level_changed = function (participant, audioLevel) {
    var width = $(`#user-list-${participant} .audiolevel-area`).parent().outerWidth();
    $(`#user-list-${participant} .audiolevel-area`).css({
        right: Math.floor((1 - audioLevel) * width),
    });
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
    JitsiMeetJS.createLocalTracks({ devices: ['audio'], micDeviceId: device_id })
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

$('#user-list').on('click', '.microphone-stat', function (e) {
    e.preventDefault();
    var id = $(this).parents('tr').attr('id').split('-')[2];
    if (id == 'me') return;
    var audio_dom = $('#audio-' + id)[0];
    if (!audio_dom) return;
    if (audio_dom.muted) {
        audio_dom.muted = false;
    } else {
        audio_dom.muted = true;
    }
    update_user_list();
});

var toggle_left = false;
$('#main-card-left-toggler').on('click', function (e) {
    e.preventDefault();
    if (toggle_left) {
        $("#main-scroll-area").animate({ left: "0%" }, 300);
        $(this).removeClass("active");
    }
    else {
        $("#main-scroll-area").animate({ left: "25%" }, 300);
        $(this).addClass("active");
    }
    toggle_left = !toggle_left;
});

var toggle_html = false;
$('#btn-preview-html').on('click', function (e) {
    e.preventDefault();

    if (toggle_html) {
        $(this).removeClass("active");
        $('#preview-html').addClass("d-none");
        $('#preview-iframe').removeClass("d-none");
    }
    else {
        $(this).addClass("active");
        $('#preview-html').removeClass("d-none");
        $('#preview-iframe').addClass("d-none");
    }
    toggle_html = !toggle_html;
    var temp_content = $("#preview-html textarea").val();
    update_preview_content(temp_content);
});

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