var feedsContainerCss = ".feed-shared-update-v2",
    commentIconCss = feedsContainerCss + " button[data-control-name=\"comment\"]",
    replyIconCss = feedsContainerCss + " button[data-control-name=\"reply\"]",
    commentsButtonContainer = ".comments-comment-box__button-group .comments-comment-box__detour-container",
    commentsInputBoxCss = "div.ql-editor[contenteditable='true']";

/**
 * Listen for url route change event and add emoji button to any opened comment inputs
 * This is required when user navigates to different page using browser forward or backward buttons
 */
chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        if (request.message === 'url_changed') {
            $(document).ready(function () {
                setTimeout(function () {
                    checkAndAddEmojiButtonToCommentBox();
                }, 2000);
            });
        }
    });

/* Register a click listener to comment/reply icon to dynamically inject the emoji button */
var addClickListener = function () {
    $(document).on('click', `${commentIconCss}, ${replyIconCss}`, function () {
        var parentContainers = $(this).parents(feedsContainerCss);
        if (parentContainers.length) {
            setTimeout(function () {
                checkAndAddEmojiButtonToCommentBox();
            }, 100);
        }
    });
};


var checkAndAddEmojiButtonToCommentBox = function () {
    $(feedsContainerCss).each(function (index, feed) {

        /* Find all comment input boxes (Uber level and child level reply inputs) for which the emoji button is not added before */
        $(feed).find(`${commentsInputBoxCss}:not([data-emoji-added])`).each(function (i, commentInput) {
            attachEmojiPopoverToPost(feed, commentInput);
        });
    });
};

var attachEmojiPopoverToPost = function (feedContainer, commentInput) {
    if (!commentInput) {
        commentInput = $(feedContainer).find(commentsInputBoxCss)[0];
    }

    /* Check if emoji button is already added to the input nox */
    if (commentInput.getAttribute("data-emoji-added") != null) {
        return;
    }

    var emojiButton = getEmojiButton();
    /* Add the emoji popover trigger button near the comments text box */
    $($(commentInput).parents("form")[0]).find(commentsButtonContainer).prepend(emojiButton);

    attachEmojiPicker(commentInput, emojiButton);
};

var getEmojiButton = function () {
    var emojiIconButton = document.createElement('template');

    /* Mimic the look and feel of the emoji button to look same as it is in messages section */
    emojiIconButton.innerHTML =
        `<button class="comments-comment-box__detour-icons artdeco-button artdeco-button--circle artdeco-button--muted artdeco-button--2 artdeco-button--tertiary ember-view" type="button">
            <li-icon aria-hidden="true" type="emoji-face-icon" class="artdeco-button__icon" size="small">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" data-supported-dps="16x16" fill="currentColor" width="16" height="16" focusable="false">
                    <path d="M4.84 6A1.16 1.16 0 116 7.17 1.17 1.17 0 014.84 6zM8 9.38a3.51 3.51 0 01-2.3-.81l-.83 1.29a4.87 4.87 0 006.25 0l-.82-1.28a3.51 3.51 0 01-2.3.8zm2-4.55A1.17 1.17 0 1011.16 6 1.17 1.17 0 0010 4.83zM8 2.88A5.12 5.12 0 112.88 8 5.12 5.12 0 018 2.88M8 1a7 7 0 107 7 7 7 0 00-7-7z"></path>
                </svg>
            </li-icon>
        </button>`;

    return emojiIconButton.content.firstChild;
};


var attachEmojiPicker = function (editableDiv, emojiButton) {
    var picker = new EmojiButton();

    picker.on('emoji', emoji => {
        if (editableDiv.innerText.trim() === '') {
            editableDiv.innerText = emoji;
        } else {
            editableDiv.innerText += emoji;
        }
    });

    emojiButton.addEventListener('click', () => {
        picker.togglePicker(emojiButton);

        /* Increase the z-index of the emoji choose popup to always display on top of all other elements */
        setTimeout(function () {
            var pickerPopup = $(".emoji-picker").parents("div[data-popper-placement]")[0];
            if (pickerPopup) {
                pickerPopup.style.zIndex = 99999;
            }
        }, 100);
    });

    $(editableDiv).attr("data-emoji-added", true);
};

/* Load the scripts */
(function () {
    addClickListener();

    $(document).ready(function () {
        setTimeout(function () {
            checkAndAddEmojiButtonToCommentBox();
        }, 2000);
    });
})();
