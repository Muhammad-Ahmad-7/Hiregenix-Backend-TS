export interface IUser {
    _id: string;
    name: string;
    email: string;
    password: string;
    isVerified: Boolean;
    resetPasswordToken?: string;
    resetPasswordExpires?: Date;
    verificationToken?: string;
    verificationTokenExpires?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface IUserInput {
    username: string;
    email: string;
    password: string;
    role: 'candidate' | 'company' | 'admin';
}

export interface IUserLogin {
    email: string;
    password: string;
}