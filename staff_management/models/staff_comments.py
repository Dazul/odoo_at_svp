# -*- coding: utf-8 -*-
from odoo import models, fields, api


class staff_comments(models.Model):
    _name = "staff.comments"

    comment = fields.Text('Comment', required=True)
    user_id = fields.Many2one('res.users', 'User', readonly=False, relate=True)
    comment_type = fields.Many2one('staff.comment.type', 'Comment Type', readonly=False, relate=True, required=True)
    create_uid = fields.Many2one('res.users', 'Author', readonly=True, relate=True)
    write_date = fields.Date('Date of comment', readonly=True)

    # during testing if error will occur then code will be migrated
    # @api.model
    # def read_group(self, domain, fields, groupby, offset, limit, orderby, lazy):
    #     print '***Read Group***'
    #     import pdb; pdb.set_trace()
    #     return super(staff_comments, self).read_group(domain, fields, groupby, offset, limit, orderby, lazy)

    # def read(self, cr, user, ids, args=None, context=None):
    #     granted_comments = []
    #     comments = super(staff_comments, self).read(cr, user, ids, args, context)
    #     auths = self.pool.get("staff.comments.authorization")
    #     for comment in comments:
    #         if 'comment_type' not in comment:
    #             granted_comments.append(comment)
    #             continue
    #         match = auths.search(cr, user, [('user_id','=',user),('comment_type','=',comment['comment_type'][0])])
    #         if len(match) > 0:
    #             granted_comments.append(comment)
    #     print len(comments)
    #     print comments
    #     print '********************************************************************'
    #     print len(granted_comments)
    #     print granted_comments
    #     return granted_comments
