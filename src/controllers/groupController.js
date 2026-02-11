const groupDao = require("../dao/groupDao");
const userDao = require("../dao/userDao");

const groupController = {

    create: async (request, response) => {
        try {
            const user = request.user;
            const { name, description, members, membersEmail, thumbnail } = request.body;
            const userInfo = await userDao.findByEmail(user.email);

            // This is to ensure backward compatibility for already created users
            // not having credits attribute.
            if (userInfo.credits === undefined) {
                userInfo.credits = 1;
            }

            // Check how many groups the user already has
            const existingGroups = await groupDao.getGroupsByAdminEmail(user.email);
            const isFirstGroup = existingGroups.length === 0;

            // If not the first group and user has no credits, prevent creation
            if (!isFirstGroup && Number(userInfo.credits) === 0) {
                return response.status(400).json({
                    message: 'You do not have enough credits to create another group. Please purchase more credits.'
                });
            }

            let allMembers = [user.email];
            
            // Handle both 'members' (new format) and 'membersEmail' (old format) for backward compatibility
            const additionalMembers = members || membersEmail;
            if (additionalMembers && Array.isArray(additionalMembers)) {
                allMembers = [...new Set([...allMembers, ...additionalMembers])];
            }

            const newGroup = await groupDao.createGroup({
                name,
                description,
                adminEmail: user.email,
                membersEmail: allMembers,
                thumbnail,
                paymentStatus: {
                    amount: 0,
                    currency: 'INR',
                    date: Date.now(),
                    isPaid: false
                }
            });

            // Only deduct credits for additional groups (not the first one)
            if (!isFirstGroup) {
                userInfo.credits -= 1;
                await userInfo.save();
            }

            response.status(201).json({
                message: isFirstGroup ? 'First group created successfully!' : 'Group created successfully',
                groupId: newGroup._id,
                isFirstGroup: isFirstGroup
            });
        } catch (error) {
            console.error(error);
            response.status(500).json({ message: "Internal server error" });
        }
    },

    update: async (request, response) => {
        try {
            const updatedGroup = await groupDao.updateGroup(request.body);
            if (!updatedGroup) {
                return response.status(404).json({ message: "Group not found" });
            }
            response.status(200).json(updatedGroup);
        } catch (error) {
            response.status(500).json({ message: "Error updating group" });
        }
    },

    addMembers: async (request, response) => {
        try {
            const { groupId, emails } = request.body;
            const updatedGroup = await groupDao.addMembers(groupId, ...emails);
            response.status(200).json(updatedGroup);
        } catch (error) {
            response.status(500).json({ message: "Error adding members" });
        }
    },

    removeMembers: async (request, response) => {
        try {
            const { groupId, emails } = request.body;
            const updatedGroup = await groupDao.removeMembers(groupId, ...emails);
            response.status(200).json(updatedGroup);
        } catch (error) {
            response.status(500).json({ message: "Error removing members" });
        }
    },

    getGroupsByUser: async (request, response) => {
        try {
            const email = request.user.email;
            const page = parseInt(request.query.page) || 1;
            const limit = parseInt(request.query.limit) || 10;
            const skip = (page - 1) * limit;

            const sortBy= request.query.sortBy || 'newest';

            let sortOptions= { createdAt: -1};
            if(sortBy === 'oldest'){
                sortOptions={ createdAt: 1};
            }
            const { groups, totalCount } = await groupDao.getGroupsPaginated(email, limit, 
skip, sortOptions);

            response.status(200).json({
            groups: groups,
            pagination: {
                totalItems: totalCount,
                totalPages: Math.ceil(totalCount / limit),
                currentPage: page,
                itemsPerPage: limit
            }
            });
        } catch (error) {
            response.status(500).json({ message: "Error fetching groups" });
        }
    },

    getGroupsByPaymentStatus: async (request, response) => {
        try {
            const { isPaid } = request.query;
            const status = isPaid === 'true';
            const groups = await groupDao.getGroupByStatus(status);
            response.status(200).json(groups);
        } catch (error) {
            response.status(500).json({ message: "Error filtering groups" });
        }
    },

    getAudit: async (request, response) => {
        try {
            const { groupId } = request.params;
            const lastSettled = await groupDao.getAuditLog(groupId);
            response.status(200).json({ lastSettled });
        } catch (error) {
            response.status(500).json({ message: "Error fetching audit log" });
        }
    },

    getGroupById: async (request, response) => {
        try {
            const { groupId } = request.params;
            const group = await groupDao.getGroupById(groupId);
            
            if (!group) {
                return response.status(404).json({ message: "Group not found" });
            }

            response.status(200).json(group);
        } catch (error) {
            response.status(500).json({ message: "Error fetching group" });
        }
    },

    deleteGroup: async (request, response) => {
        try {
            const { groupId } = request.params;
            const user = request.user;
            
            // Get group to verify ownership
            const group = await groupDao.getGroupById(groupId);
            
            if (!group) {
                return response.status(404).json({ message: "Group not found" });
            }

            // Check if user is the admin of this group
            if (group.adminEmail !== user.email) {
                return response.status(403).json({ message: "You can only delete groups you admin" });
            }

            // Delete the group
            await groupDao.deleteGroup(groupId);
            
            response.status(200).json({ message: "Group deleted successfully" });
        } catch (error) {
            console.error(error);
            response.status(500).json({ message: "Error deleting group" });
        }
    }
};

module.exports = groupController;