-- コミュニティ通知のenum値追加（別トランザクション必須）
alter type notification_kind add value if not exists 'post_commented';
alter type notification_kind add value if not exists 'post_liked';
alter type notification_kind add value if not exists 'comment_replied';
alter type notification_kind add value if not exists 'new_follower';
