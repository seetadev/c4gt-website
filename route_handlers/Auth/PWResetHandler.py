from flask import render_template, request
import logging
import cloud

class PWResetHandler:
    @staticmethod
    def get():
        # Retrieve user and reset token from the request arguments
        user = request.args.get('u')
        token = request.args.get('d')
        logging.info("password reset page requested")

        # Verify the token
        if user and cloud.authenticate.user.verify_reset_token(user, token):
            return render_template("pwreset.html", reguser=user, token=token)

        # Invalid or expired token, or unknown user
        return render_template("pwreset-invalid.html", reguser=user), 400

    @staticmethod
    def post():
        user = request.form.get('email')
        password = request.form.get('password')
        token = request.form.get('token')
        logging.info("password reset submitted")

        # Change the password only for a valid, unexpired, unused token issued to this user
        if user and cloud.authenticate.user.reset_password_with_token(user, token, password):
            return render_template("pwreset-ok.html", reguser=user)
        return render_template("pwreset-invalid.html", reguser=user), 400
