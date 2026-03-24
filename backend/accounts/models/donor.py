from .base import BaseProfile


class Donor(BaseProfile):

    def __str__(self):
        return "Donor: " + self.user.email
