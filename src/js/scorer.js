// alert("onload event - alert loaded from js");

// $('document').ready(function() {
//     $('.printLink').click(function() {
//         $(this).addClass('jqueryTest');
//     });
// });

$('document').ready(function() {
    $('.printBtn').click(function() {
        console.log('disabling print button');
        $(this).attr('disabled', true);
    });
});