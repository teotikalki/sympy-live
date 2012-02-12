function makeTransition(elemId, arrowId, closedHeight, openHeight) {
    return (function(){
        var closedHeight = 35;
        // relies on parseInt ignoring invalid trailing content
        var margin = parseInt($('.content').css('margin-top'), 10);
        var openHeight = $(elemId + ' .content').height() + margin;
        var elem = $(elemId), arrow = $(arrowId);
        if (elem.height() === closedHeight) {
            elem.height(openHeight);
            arrow.addClass('clicked');
        }
        else {
            elem.height(closedHeight);
            arrow.removeClass('clicked');
        }
    });
}

$(document).ready(function(){
    $('.clickable_top').each(function(i, elem){
        var elem_id = $(elem).parents('div').first().attr('id');
        var arrow_id = elem_id + '_arrow';
        $('#' + arrow_id).addClass('arrow');
        $(elem).click(makeTransition('#' + elem_id, '#' + arrow_id));
    });
});

function clear_searches(){
    var confirm_delete = confirm("Are you sure you want to clear your search history?");
    if (confirm_delete===true)
    {
        Ext.Ajax.request({
            method: 'GET',
            url: (this.basePath || '') + '/delete',
            success: function(response) {
                var response = response.responseText;
                Ext.fly('saved_searches').update(response);
            },
        });
    }
}
