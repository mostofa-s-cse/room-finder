import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const requestData = await request.json();
    const { userId } = await params;

    // Handle legacy action-based updates (suspend/activate/ban)
    if (requestData.action) {
      const { action, reason } = requestData;
      
      let status: string;
      switch (action) {
        case 'suspend':
          status = 'SUSPENDED';
          break;
        case 'activate':
          status = 'ACTIVE';
          break;
        case 'ban':
          status = 'BANNED';
          break;
        default:
          return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { status },
        select: {
          id: true,
          name: true,
          email: true,
          status: true,
          role: true
        }
      });

      // Log admin action
      await prisma.adminLog.create({
        data: {
          adminId: session.user.id,
          action: `USER_${action.toUpperCase()}`,
          targetId: userId,
          targetType: 'USER',
          details: `${action} user ${updatedUser.email}`
        }
      });

      return NextResponse.json({ success: true, user: updatedUser });
    }

    // Handle full user update (name, email, role, status, password)
    const { name, email, role, status, password, notes } = requestData;
    
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (role !== undefined) updateData.role = role;
    if (status !== undefined) updateData.status = status;
    if (password !== undefined && password.trim()) {
      // Hash the password before storing (you should use bcrypt or similar)
      const bcrypt = require('bcryptjs');
      updateData.password = await bcrypt.hash(password, 12);
    }

    // Validate role and status values
    if (role && !['BACHELOR', 'LANDLORD'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }
    if (status && !['ACTIVE', 'SUSPENDED', 'BANNED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        role: true,
        createdAt: true,
        lastLogin: true
      }
    });

    // Log admin action
    const changes = Object.keys(updateData).map(key => `${key}: ${updateData[key]}`).join(', ');
    await prisma.adminLog.create({
      data: {
        adminId: session.user.id,
        action: 'USER_UPDATE',
        targetId: userId,
        targetType: 'USER',
        details: `Updated user ${updatedUser.email} - ${changes}${notes ? ` (Notes: ${notes})` : ''}`
      }
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('User update error:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}