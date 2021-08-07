from django.http.response import JsonResponse
from django.shortcuts import render
from django.views.generic import View

from solver.lp import FlowLp


class IndexView(View):

    def get(self, request, *args, **kwargs):
        return render(request, 'solver/index.html')

    def post(self, request, *args, **kwargs):
        lp = FlowLp(request.body)
        lp.solve()
        return JsonResponse({'model': lp.model, 'report': lp.report(), 'status': lp.status})
